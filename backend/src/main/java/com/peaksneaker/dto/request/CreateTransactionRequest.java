package com.peaksneaker.dto.request;

import com.peaksneaker.enums.InventoryTransactionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTransactionRequest {

    @NotNull(message = "ID biến thể không được để trống")
    private Long variantId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng xuất nhập kho tối thiểu là 1")
    private Integer quantity;

    @NotNull(message = "Loại giao dịch không được để trống")
    private InventoryTransactionType type;

    private String note;
}
