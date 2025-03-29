import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { INVITATION_TYPES, BOARD_INVITATION_STATUS } from '~/utils/constants'
import { pickUser } from '~/utils/formatters'

const createNewBoardInvitation = async (reqBody, inviterId) => {
  try {
    // Tìm người gửi lời mời
    const inviter = await userModel.findOneById(inviterId)
    // Tìm người nhận lời mời bằng email
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)
    // Tìm board để kiểm tra tính hợp lệ
    const board = await boardModel.findOneById(reqBody.boardId)

    // Kiểm tra nếu một trong ba thực thể không tồn tại
    if (!inviter || !invitee || !board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, Invitee or Board not found!')
    }

    // Tạo dữ liệu lời mời mới
    const newInvitationData = {
      inviterId,
      inviteeId: invitee._id.toString(),
      type: INVITATION_TYPES.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING
      }
    }

    // Lưu lời mời vào database
    const createdInvitation = await invitationModel.createNewBoardInvitation(newInvitationData)
    const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId)

    // Định dạng kết quả trả về
    const resInvitation = {
      ...getInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee)
    }

    return resInvitation
  } catch (error) {
    throw error
  }
}

const getInvitations = async (userId) => {
  try {
    const getInvitations = await invitationModel.findByUser(userId)
    // console.log('getInvitations', getInvitations)

    // Vì các dữ liệu inviter, invitee và board là đang ở giá trị mảng 1 phần tử nếu lấy ra được nên chúng ta biến đổi nó về Json Object trước khi trả về cho phía be
    const resInvitations = getInvitations.map(i => {
      return {
        ...i,
        inviter: i.inviter[0] || {},
        invitee: i.invitee[0] || {},
        board: i.board[0] || {}
      }
    })

    return resInvitations
  } catch (error) {
    throw error
  }
}

const updateBoardInvitation = async (userId, invitationId, status) => {
  try {
    // Tìm bản ghi invitation trong model
    const getInvitation = await invitationModel.findOneById(invitationId)
    if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')

    // Sau khi có Invitation rồi thì lấy full thông tin của board
    const boardId = getInvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // Kiểm tra xem nếu status là ACCEPTED join board mà cái thằng user (invitee) đã là owner hoặc member của board rồi thì trả về thông báo lỗi luôn.
    // Note: 2 mảng memberIds và ownerIds của board nó đang là kiểu dữ liệu ObjectId nên cho nó về String hết luôn để check
    const boardOwnerAndMemberIds = [...getBoard.ownerIds, ...getBoard.memberIds].toString()
    console.log(boardOwnerAndMemberIds)
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && boardOwnerAndMemberIds.includes(userId)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You already a number of thí board')
    }

    // Tạo dữ liệu để update
    const updateData = {
      boardInvitation: {
        ...getInvitation.boardInvitation,
        status: status // status là ACCEPTED hoặc REJECTED do FE gửi lên
      }
    }

    // Cập nhật status trong bản ghi Invitation
    const updatedInvitation = await invitationModel.update(invitationId, updateData)

    // Nếu trường hợp Accept một lời mời thành công, thì cần phải thêm thông tin của thằng user (userId) vào bản ghi memberIds trong collection board.
    if (updatedInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
      await boardModel.pushMemberIds(boardId, userId)
    }

    return updatedInvitation
  } catch (error) {
    throw error
  }
}

export const invitationService = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation
}