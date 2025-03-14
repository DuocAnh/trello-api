import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

// Middleware này đảm nhiệm việc quan trọng: Xác thực cái JWT accessToken nhận được từ phía FE có hợp lệ hay không
const isAuthorized = async (req, res, next) => {
  // Lấy accessToken nằm trong request cookies phía client - withCredentials trong file authorizeAxios
  const clientAccessToken = req.cookies?.accessToken

  // Nếu như clientAccessToken không tồn tại thì trả về lỗi
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (token not found)'))
    return
  }

  try {
    // Giải mã token xem có hợp lệ không
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    // console.log('🚀 ~ isAuthorized ~ accessTokenDecoded:', accessTokenDecoded)
    // Lưu thông tin giải mã được vào req.jwtDecoded để sử dụng các tầng xử lý sau
    req.jwtDecoded = accessTokenDecoded
    // Cho phép request đi tiếp
    next()
  } catch (error) {
    // console.log('🚀 ~ isAuthorized ~ error:', error)
    // Nếu token hết hạn, trả về mã lỗi 410 để FE gọi API refreshToken
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
      return
    }
    // Nếu token không hợp lệ vì lý do khác, trả về 401 để FE gọi API sign_out
    next(new ApiError(StatusCodes.UNAUTHORIZED), 'Unauthorized!')
  }
}

export const authMiddleware = { isAuthorized }