function generateRoomId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let roomId = "";
  for (let i = 0; i < 9; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    roomId += characters.charAt(randomIndex);
    if ((i + 1) % 3 === 0 && i !== 8) {
      roomId += "-";
    }
  }
  return roomId;
}

module.exports = { generateRoomId };
