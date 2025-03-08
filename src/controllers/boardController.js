import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    // console.log('req.body: ', req.body)
    // console.log('req.query: ', req.query)
    // console.log('req.params: ', req.params)
    // console.log('req.files: ', req.files)
    // console.log('req.cookies: ', req.cookies)
    // console.log('req.jwtDecoded: ', req.jwtDecoded)

    // Điều hướng dữ liệu sang tầng service

    const createBoard = await boardService.createNew(req.body)
    // Có kết quả thì trả về client
    res.status(StatusCodes.CREATED).json(createBoard)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createNew
}