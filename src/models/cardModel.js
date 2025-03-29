import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE, EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'
import { CARD_MEMBER_ACTIONS } from '~/utils/constants'

// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  cover: Joi.string().default(null),
  memberIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  // Dữ liệu comments của Card nhúng - embedded vào bản ghi Card:
  comments: Joi.array().items({
    userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    userAvatar: Joi.string(),
    userDisplayName: Joi.string(),
    content: Joi.string(),
    // Chú ý: Vì dùng hàm `push` để thêm comment nên không set default `Date.now()`
    // giống như insertOne khi create được.
    commentedAt: Joi.date().timestamp()
  }).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS= ['_id', 'boardId', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const valiData = await validateBeforeCreate(data)
    const newCardToAdd = {
      ...valiData,
      boardId: new ObjectId(valiData.boardId),
      columnId: new ObjectId(valiData.columnId)
    }
    const createCard = await GET_DB().collection(CARD_COLLECTION_NAME).insertOne(newCardToAdd)

    return createCard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (cardId, updateData) => {
  try {
    // Lọc những field không cho phép update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData(fieldName)
      }
    })

    if (updateData.columnId) updateData.columnId = new ObjectId(updateData.columnId)

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByColumnId = async (columnId) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).deleteMany({
      columnId: new ObjectId(columnId)
    })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Đẩy một phần tử comment vào đầu mảng comments
 * - Trong JS, ngược lại với push (thêm phần tử vào cuối mảng) sẽ là unshift (thêm phần tử vào đầu mảng)
 * - Nhưng trong mongodb hiện tại chỉ có $push – mặc định đẩy phần tử vào cuối mảng.
 * - Vẫn dùng $push, nhưng bọc data vào Array để trong $each và chỉ định $position: 0
 * https://stackoverflow.com/questions/7936019/how-do-i-add-a-value-to-the-top-of-an-array-in-mongodb/25732817#25732817
 * https://www.mongodb.com/docs/manual/reference/operator/update/position/
 */
const unshiftNewComment = async (cardId, commentData) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $push: { comments: { $each: [commentData], $position: 0 } } },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Hàm này sẽ có nhiệm vụ xử lý cập nhật thêm hoặc xóa member khỏi card dựa theo Action
 * Sẽ dùng $push để thêm hoặc $pull để loại bỏ ($pull trong mongodb để lấy một phần tử ra khỏi mảng rồi xóa nó đi)
 */
const updateMembers = async (cardId, incomingMemberInfo) => {
  try {
    // Tạo ra một biến updateCondition ban đầu là rỗng
    let updateCondition = {}
    if (incomingMemberInfo.action === CARD_MEMBER_ACTIONS.ADD) {
      // console.log('Trường hợp Add, dùng $push:', incomingMemberInfo)
      updateCondition = { $push: { memberIds: new ObjectId(incomingMemberInfo.userId) } }
    }
    if (incomingMemberInfo.action === CARD_MEMBER_ACTIONS.REMOVE) {
      // console.log('Trường hợp Remove, dùng $pull:', incomingMemberInfo)
      updateCondition = { $pull: { memberIds: new ObjectId(incomingMemberInfo.userId) } }
    }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      updateCondition, // truyền cái updateCondition ở đây
      { returnDocument: 'after' }
    )

    return result
  } catch (error) { throw new Error(error) }
}

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  deleteManyByColumnId,
  unshiftNewComment,
  updateMembers
}
