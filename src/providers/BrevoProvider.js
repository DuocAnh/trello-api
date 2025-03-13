// Lưu ý Brevo là tên thương hiệu mới của sib Sendinblue
// Vì thế trong phần hướng dẫn trên github có thể nó vẫn còn giữ tên biển SibAp1V3Sdk
//https://github.com/getbrevo/brevo-node
const SibApiV3Sdk = require('@getbrevo/brevo')
import { env } from '~/config/environment'

/** Có thể xem thêm phần dọc cấu hình theo từng ngôn ngữ khác nhau tùy dự án à Brevo Dashboard > Account
SMTP & API API Keys
https://brevo.com
Với Nodejs thì tốt nhất cử lên github repo của bọn nó là nhanh nhất:
https://github.com/getbrevo/brevo-node
*/
let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
  // Khởi tạo sendSmtpEmail với những thông tin cần thiết
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

  sendSmtpEmail.sender = { email: env.ADMIN_EMAIL_ADDRESS, name: env.ADMIN_EMAIL_NAME }

  // Những tài khoản nhận mail
  sendSmtpEmail.to = [{ email: recipientEmail }]

  // Tiêu đề của email
  sendSmtpEmail.subject = customSubject

  // Nôi dung email
  sendSmtpEmail.htmlContent = htmlContent

  // Gọi hành động gửi email return 1 promise
  return apiInstance.sendTransacEmail(sendSmtpEmail)
}

export const BrevoProvider = {
  sendEmail
}