package com.peaksneaker.dto.request;

import java.math.BigDecimal;
import java.time.Instant;

import com.peaksneaker.enums.DiscountType;
import com.peaksneaker.enums.VoucherApplicationScope;
import com.peaksneaker.enums.VoucherChannel;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVoucherRequest {
    @NotBlank(message = "Mã khuyến mãi không được để trống")
    @Size(max = 50, message = "Mã khuyến mãi không được vượt quá 50 ký tự")
    @Pattern(
        regexp = "^[A-Za-z0-9_-]+$",
        message = "Mã khuyến mãi chỉ được chứa chữ cái, chữ số, dấu gạch ngang và gạch dưới"
    )
    private String code;

    @NotBlank(message = "Tên chương trình không được để trống")
    @Size(max = 160, message = "Tên chương trình không được vượt quá 160 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Loại khuyến mãi không được để trống")
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0", message = "Giá trị đơn tối thiểu không được âm")
    private BigDecimal minOrderAmount;

    @DecimalMin(value = "0", inclusive = false, message = "Mức giảm tối đa phải lớn hơn 0")
    private BigDecimal maxDiscountAmount;

    @Min(value = 1, message = "Tổng lượt dùng phải lớn hơn 0")
    private Integer usageLimit;

    @Min(value = 1, message = "Lượt dùng mỗi khách phải lớn hơn 0")
    private Integer perUserLimit;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private Instant startAt;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private Instant expireAt;
    private Boolean isActive;

    @Builder.Default
    private VoucherApplicationScope applicationScope = VoucherApplicationScope.ALL_PRODUCTS;

    @Builder.Default
    private VoucherChannel applicationChannel = VoucherChannel.WEB;

    @Builder.Default
    private Boolean isCombinable = false;
}
