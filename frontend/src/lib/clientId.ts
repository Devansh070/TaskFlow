// A random id unique to this browser tab's session — lets a tab recognize
// and ignore the echo of its own change coming back over the socket
// (it already applied the change optimistically).
export const clientId = crypto.randomUUID();