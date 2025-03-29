// param socket lấy từ thư viện socketio
export const inviteUserToBoardSocket = (socket) => {
  // Lắng nghe sự kiện mà client emit lên FE_USER_INVTED_TO_BOARD
  socket.on('FE_USER_INVTED_TO_BOARD', (invitaion) => {
    // emit ngược lại 1 sự kiện cho mội client khác trừ client gửi req
    socket.broadcast.emit('BE_USER_INVTED_TO_BOARD', invitaion)
  })
}