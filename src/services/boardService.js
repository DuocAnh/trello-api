/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createNew = async (reqBody) => {
  try {
    // Xử lý logic dữ liệu
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Model
    const createBoard = await boardModel.createNew(newBoard)
    // console.log(createBoard)

    // Lấy bản ghi board sau khi gọi
    const getNewBoard = await boardModel.findOneById(createBoard.insertedId)
    // console.log(getNewBoard)

    return getNewBoard
  } catch (error) {
    throw error
  }
}

const getDetails = async (boardId) => {
  try {
    const board = await boardModel.getDetails(boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

    return board
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew,
  getDetails
}