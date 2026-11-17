package com.peaksneaker.service.impl;

import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.OrderItem;
import com.peaksneaker.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:22130306@st.hcmuaf.edu.vn}")
    private String fromEmail;

    @Override
    @Async
    public void sendOtpEmail(String toEmail, String otpCode, String recipientName) {
        String subject = "PeakSneaker - Mã xác thực tài khoản OTP";
        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">"
                + "<div style=\"text-align: center; padding-bottom: 20px; border-bottom: 2px solid #111827;\">"
                + "<h1 style=\"color: #111827; margin: 0; font-size: 24px;\">PEAKSNEAKER</h1>"
                + "<p style=\"color: #6b7280; font-size: 14px; margin-top: 4px;\">Authentic Sneakers & Streetwear</p>"
                + "</div>"
                + "<div style=\"padding: 24px 0;\">"
                + "<p style=\"font-size: 16px; color: #374151;\">Xin chào <strong>" + (recipientName != null ? recipientName : "Quý khách") + "</strong>,</p>"
                + "<p style=\"font-size: 15px; color: #4b5563; line-height: 1.6;\">Cảm ơn bạn đã đăng ký tài khoản tại PeakSneaker. Vui lòng nhập mã OTP dưới đây để xác thực và kích hoạt tài khoản của bạn:</p>"
                + "<div style=\"text-align: center; margin: 30px 0;\">"
                + "<span style=\"display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; background: linear-gradient(135deg, #1f2937, #111827); padding: 12px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);\">"
                + otpCode + "</span>"
                + "</div>"
                + "<p style=\"font-size: 14px; color: #ef4444; text-align: center;\">Mã xác thực có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>"
                + "</div>"
                + "<div style=\"border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;\">"
                + "<p>Email này được gửi tự động từ hệ thống PeakSneaker. Vui lòng không phản hồi trực tiếp vào email này.</p>"
                + "</div>"
                + "</div>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken, String recipientName) {
        String subject = "PeakSneaker - Yêu cầu khôi phục mật khẩu";
        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">"
                + "<div style=\"text-align: center; padding-bottom: 20px; border-bottom: 2px solid #111827;\">"
                + "<h1 style=\"color: #111827; margin: 0; font-size: 24px;\">PEAKSNEAKER</h1>"
                + "</div>"
                + "<div style=\"padding: 24px 0;\">"
                + "<p style=\"font-size: 16px; color: #374151;\">Xin chào <strong>" + (recipientName != null ? recipientName : "Quý khách") + "</strong>,</p>"
                + "<p style=\"font-size: 15px; color: #4b5563; line-height: 1.6;\">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản PeakSneaker của bạn. Mã xác thực đặt lại mật khẩu của bạn là:</p>"
                + "<div style=\"text-align: center; margin: 30px 0;\">"
                + "<span style=\"display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #ffffff; background: #dc2626; padding: 12px 28px; border-radius: 8px;\">"
                + resetToken + "</span>"
                + "</div>"
                + "<p style=\"font-size: 14px; color: #6b7280;\">Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với bộ phận hỗ trợ khách hàng của chúng tôi ngay lập tức.</p>"
                + "</div>"
                + "<div style=\"border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;\">"
                + "<p>Bản quyền thuộc về PeakSneaker Team © 2026.</p>"
                + "</div>"
                + "</div>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    @Async
    public void sendOrderConfirmationEmail(String toEmail, Order order) {
        String subject = "PeakSneaker - Xác nhận đơn hàng #" + order.getId();
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

        StringBuilder itemsHtml = new StringBuilder();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                itemsHtml.append("<tr>")
                        .append("<td style=\"padding: 10px; border-bottom: 1px solid #e5e7eb;\">")
                        .append("<strong>").append(item.getProductName()).append("</strong><br/>")
                        .append("<span style=\"font-size: 12px; color: #6b7280;\">Phân loại: ").append(item.getVariantName() != null ? item.getVariantName() : "").append("</span>")
                        .append("</td>")
                        .append("<td style=\"padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;\">").append(item.getQuantity()).append("</td>")
                        .append("<td style=\"padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;\">")
                        .append(currencyFormat.format(item.getSubtotal()))
                        .append("</td>")
                        .append("</tr>");
            }
        }

        String fullAddress = (order.getShippingStreet() != null ? order.getShippingStreet() + ", " : "")
                + (order.getShippingWard() != null ? order.getShippingWard() + ", " : "")
                + (order.getShippingDistrict() != null ? order.getShippingDistrict() + ", " : "")
                + (order.getShippingProvince() != null ? order.getShippingProvince() : "");

        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">"
                + "<div style=\"text-align: center; padding-bottom: 15px; border-bottom: 2px solid #111827;\">"
                + "<h1 style=\"color: #111827; margin: 0; font-size: 24px;\">PEAKSNEAKER</h1>"
                + "<h3 style=\"color: #10b981; margin: 8px 0 0 0;\">Đặt hàng thành công!</h3>"
                + "</div>"
                + "<div style=\"padding: 20px 0;\">"
                + "<p>Kính gửi <strong>" + order.getShippingName() + "</strong>,</p>"
                + "<p>Cảm ơn bạn đã mua sắm tại PeakSneaker. Đơn hàng <strong>#" + order.getId() + "</strong> đã được tiếp nhận và đang trong quá trình đóng gói vận chuyển.</p>"
                + "<h4 style=\"margin-top: 20px; color: #1f2937;\">Thông tin giao hàng:</h4>"
                + "<p style=\"font-size: 14px; color: #4b5563; line-height: 1.5;\">"
                + "Người nhận: " + order.getShippingName() + "<br/>"
                + "Số điện thoại: " + order.getShippingPhone() + "<br/>"
                + "Địa chỉ: " + fullAddress + "<br/>"
                + "Phương thức thanh toán: " + order.getPaymentMethod() + "<br/>"
                + "Trạng thái thanh toán: " + order.getPaymentStatus()
                + "</p>"
                + "<h4 style=\"margin-top: 20px; color: #1f2937;\">Chi tiết sản phẩm:</h4>"
                + "<table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">"
                + "<thead><tr style=\"background-color: #f3f4f6;\">"
                + "<th style=\"padding: 8px; text-align: left;\">Sản phẩm</th>"
                + "<th style=\"padding: 8px; text-align: center;\">SL</th>"
                + "<th style=\"padding: 8px; text-align: right;\">Thành tiền</th>"
                + "</tr></thead>"
                + "<tbody>" + itemsHtml.toString() + "</tbody>"
                + "</table>"
                + "<div style=\"margin-top: 15px; text-align: right; font-size: 14px;\">"
                + "<p>Tạm tính: " + currencyFormat.format(order.getSubtotalAmount() != null ? order.getSubtotalAmount() : java.math.BigDecimal.ZERO) + "</p>"
                + "<p>Phí vận chuyển: " + currencyFormat.format(order.getShippingFee() != null ? order.getShippingFee() : 0) + "</p>"
                + (order.getDiscountAmount() != null && order.getDiscountAmount().doubleValue() > 0 
                    ? "<p style=\"color: #10b981;\">Giảm giá: -" + currencyFormat.format(order.getDiscountAmount()) + "</p>" : "")
                + "<p style=\"font-size: 18px; font-weight: bold; color: #dc2626;\">Tổng thanh toán: " + currencyFormat.format(order.getFinalAmount()) + "</p>"
                + "</div>"
                + "</div>"
                + "<div style=\"border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;\">"
                + "<p>Mọi thắc mắc xin vui lòng liên hệ hotline hoặc gửi phản hồi qua hệ thống PeakSneaker.</p>"
                + "</div>"
                + "</div>";

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    @Async
    public void sendReturnStatusEmail(String toEmail, Long returnId, String status, String note) {
        String subject = "PeakSneaker - Cập nhật trạng thái yêu cầu đổi trả #" + returnId;
        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;\">"
                + "<h2 style=\"color: #111827;\">PEAKSNEAKER - THÔNG BÁO ĐỔI TRẢ</h2>"
                + "<p>Yêu cầu đổi/trả hàng mã số <strong>#" + returnId + "</strong> của bạn đã được cập nhật trạng thái:</p>"
                + "<p style=\"font-size: 16px; font-weight: bold; color: #2563eb;\">Trạng thái: " + status + "</p>"
                + (note != null && !note.isEmpty() ? "<p>Ghi chú từ quản trị viên: <em>" + note + "</em></p>" : "")
                + "<p>Cảm ơn bạn đã luôn đồng hành cùng PeakSneaker!</p>"
                + "</div>";
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail, "PeakSneaker Store");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email đã được gửi thành công đến: {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email đến {}: {}", toEmail, e.getMessage(), e);
        }
    }
}
