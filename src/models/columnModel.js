import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Define Collection (name & schema)
const COLUMN_COLLECTION_NAME = 'columns'
const COLUMN_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),

  cardOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// Những trường không cho phép cập nhật
const INVALID_UPDATE_FIELDS= ['_id', 'boardId', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await COLUMN_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const valiData = await validateBeforeCreate(data)
    const newColumnToAdd = {
      ...valiData,
      boardId: new ObjectId(valiData.boardId)
    }
    const createColumn = await GET_DB().collection(COLUMN_COLLECTION_NAME).insertOne(newColumnToAdd)

    return createColumn
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Push giá trị card id vào cuối mảng cardOrderIds
const pushCardOrderIds = async (card) => {
  try {
    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(card.columnId) },
      { $push: { cardOrderIds: new ObjectId(card._id) } },
      { returnDocument: 'after' }
    )

    return result.value
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (columnId, updateData) => {
  try {
    // Lọc những field không cho phép update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData(fieldName)
      }
    })

    if (updateData.cardOrderIds) {
      updateData.cardOrderIds = updateData.cardOrderIds.map(_id => (new ObjectId(_id)))
    }

    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(columnId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (columnId) => {
  try {
    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).deleteOne({
      _id: new ObjectId(columnId)
    })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const columnModel = {
  COLUMN_COLLECTION_NAME,
  COLUMN_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  pushCardOrderIds,
  update,
  deleteOneById
}
