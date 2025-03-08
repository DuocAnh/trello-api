/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'

const createNew = async (reqBody) => {
  try {
    // Xử lý logic dữ liệu
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // model

    return newBoard
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew
}