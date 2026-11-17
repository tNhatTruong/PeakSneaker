package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "batch_code", nullable = false, length = 100)
    private String batchCode;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "quantity_imported", nullable = false)
    private Integer quantityImported;

    @Column(name = "quantity_remaining", nullable = false)
    private Integer quantityRemaining;

    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "po_number", length = 100)
    @Builder.Default
    private String poNumber = "PO-2026-DEFAULT";

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "payment_status", nullable = false, length = 50)
    @Builder.Default
    private String paymentStatus = "PAID";

    @Column(name = "is_quarantined", nullable = false)
    @Builder.Default
    private Boolean isQuarantined = false;

    @Column(name = "quarantine_reason", columnDefinition = "TEXT")
    private String quarantineReason;

    @Column(name = "received_date", nullable = false, updatable = false)
    @Builder.Default
    private Instant receivedDate = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (receivedDate == null) {
            receivedDate = Instant.now();
        }
    }
}
