export const ROOM_IMAGE_BY_ID = {
  1: "/room.png",
  2: "/room2.png",
  407: "/room407.png",
};

export const DEFAULT_ROOM_IMAGE = ROOM_IMAGE_BY_ID[1];

export const getDefaultRoomImage = (roomId) => ROOM_IMAGE_BY_ID[Number(roomId)] || DEFAULT_ROOM_IMAGE;

const getStoredRoomImageKey = (roomId) => {
  const numericRoomId = Number(roomId);
  return Number.isFinite(numericRoomId) ? `uploadedImage:${numericRoomId}` : "uploadedImage";
};

const hasHttpProtocol = (value) => /^https?:\/\//i.test(value);

export const getBackendOrigin = (backendHost) => {
  if (!backendHost || typeof backendHost !== "string") {
    return "";
  }

  return hasHttpProtocol(backendHost) ? backendHost : `http://${backendHost}`;
};

export const sanitizeRoomImage = (imageValue) => {
  if (!imageValue || typeof imageValue !== "string") {
    return null;
  }

  if (imageValue === "undefined" || imageValue === "null") {
    return null;
  }

  if (imageValue.startsWith("data:") && !imageValue.startsWith("data:image/")) {
    return null;
  }

  return imageValue;
};

export const resolveRoomImageUrl = (imageUrl, backendHost, roomId) => {
  const sanitizedImageUrl = sanitizeRoomImage(imageUrl);
  const defaultRoomImage = getDefaultRoomImage(roomId);

  if (!sanitizedImageUrl) {
    return defaultRoomImage;
  }

  if (
    sanitizedImageUrl.startsWith("data:image/") ||
    sanitizedImageUrl.startsWith("blob:") ||
    hasHttpProtocol(sanitizedImageUrl)
  ) {
    return sanitizedImageUrl;
  }

  if (Object.values(ROOM_IMAGE_BY_ID).includes(sanitizedImageUrl)) {
    return sanitizedImageUrl;
  }

  const backendOrigin = getBackendOrigin(backendHost);
  if (!backendOrigin) {
    return sanitizedImageUrl;
  }

  return sanitizedImageUrl.startsWith("/")
    ? `${backendOrigin}${sanitizedImageUrl}`
    : `${backendOrigin}/${sanitizedImageUrl}`;
};

export const getStoredRoomImage = (roomId) => {
  const storageKey = getStoredRoomImageKey(roomId);
  const storedImage = sanitizeRoomImage(localStorage.getItem(storageKey));

  if (!storedImage) {
    localStorage.removeItem(storageKey);
    return getDefaultRoomImage(roomId);
  }

  return storedImage;
};

export const saveRoomImage = (imageValue, roomId) => {
  const storageKey = getStoredRoomImageKey(roomId);
  const sanitizedImage = sanitizeRoomImage(imageValue);

  if (!sanitizedImage) {
    localStorage.removeItem(storageKey);
    return getDefaultRoomImage(roomId);
  }

  localStorage.setItem(storageKey, sanitizedImage);
  return sanitizedImage;
};

export const fetchRoomImageAsDataUrl = async (imageUrl, backendHost, roomId) => {
  const resolvedImageUrl = resolveRoomImageUrl(imageUrl, backendHost, roomId);
  const defaultRoomImage = getDefaultRoomImage(roomId);

  if (
    Object.values(ROOM_IMAGE_BY_ID).includes(resolvedImageUrl) ||
    resolvedImageUrl.startsWith("data:image/") ||
    resolvedImageUrl.startsWith("blob:")
  ) {
    return resolvedImageUrl;
  }

  const response = await fetch(resolvedImageUrl);
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    return defaultRoomImage;
  }

  if (!contentType.startsWith("image/")) {
    return defaultRoomImage;
  }

  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = sanitizeRoomImage(reader.result);

      if (typeof result === "string" && result.startsWith("data:image/")) {
        resolve(result);
        return;
      }

      reject(new Error("Failed to decode room image as a data URL."));
    };

    reader.onerror = () => reject(reader.error || new Error("Failed to read room image."));
    reader.readAsDataURL(blob);
  });
};
