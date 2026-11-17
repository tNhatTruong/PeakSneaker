package com.peaksneaker.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peaksneaker.dto.response.GhnCreateOrderResult;
import com.peaksneaker.entity.Order;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.service.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class GhnServiceImpl implements GhnService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ghn.api.token}")
    private String apiToken;

    @Value("${ghn.api.shopId}")
    private String shopId;

    @Value("${ghn.api.url}")
    private String feeUrl;

    @Value("${ghn.api.create-order-url:https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create}")
    private String createOrderUrl;

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", apiToken);
        headers.set("ShopId", shopId);
        headers.set("Content-Type", "application/json");
        return headers;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Object getProvinces() {
        String url = "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province";
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
        Object body = response.getBody();
        if (body instanceof Map<?, ?> rawMap && rawMap.get("data") instanceof List<?> rawList) {
            List<?> filtered = rawList.stream()
                    .filter(item -> {
                        if (!(item instanceof Map<?, ?> province)) return true;
                        Object nameObj = province.get("ProvinceName");
                        if (nameObj == null) return false;
                        String name = nameObj.toString().trim();
                        String lower = name.toLowerCase();
                        if (lower.contains("test") || lower.contains("alert") || lower.contains("ngưng hoạt động")) {
                            return false;
                        }
                        return !name.matches(".*\\s+\\d+$");
                    })
                    .toList();
            Map<String, Object> sanitized = new HashMap<>((Map<String, Object>) rawMap);
            sanitized.put("data", filtered);
            return sanitized;
        }
        return body;
    }

    @Override
    public Object getDistricts(int provinceId) {
        String url = "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=" + provinceId;
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
        return response.getBody();
    }

    @Override
    public Object getWards(int districtId) {
        String url = "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=" + districtId;
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
        return response.getBody();
    }

    @Override
    public Object calculateFee(int toDistrictId, String toWardCode) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("service_type_id", 2);
        requestBody.put("to_district_id", toDistrictId);
        requestBody.put("to_ward_code", toWardCode);
        requestBody.put("height", 15);
        requestBody.put("length", 30);
        requestBody.put("width", 20);
        requestBody.put("weight", 1000);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, createHeaders());
        ResponseEntity<Object> response = restTemplate.exchange(feeUrl, HttpMethod.POST, entity, Object.class);
        return response.getBody();
    }

    @Override
    public BigDecimal calculateFeeAmount(int toDistrictId, String toWardCode) {
        Object response = calculateFee(toDistrictId, toWardCode);
        if (!(response instanceof Map<?, ?> responseMap)
                || !(responseMap.get("data") instanceof Map<?, ?> data)
                || data.get("total") == null) {
            throw new BadRequestException("Không thể xác định phí giao hàng từ GHN.");
        }
        try {
            return new BigDecimal(data.get("total").toString());
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Phí giao hàng GHN trả về không hợp lệ.");
        }
    }

    @Override
    public GhnCreateOrderResult createOrder(Order order, int toDistrictId, String toWardCode) {
        List<Map<String, Object>> items = order.getItems().stream()
                .map(item -> Map.<String, Object>of(
                        "name", item.getProductName(),
                        "code", item.getSku(),
                        "quantity", item.getQuantity(),
                        "price", item.getUnitPrice().intValue(),
                        "length", 30,
                        "width", 20,
                        "height", 15,
                        "weight", 1000))
                .toList();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("payment_type_id", 1);
        requestBody.put("note", order.getNote() == null ? "" : order.getNote());
        requestBody.put("required_note", "CHOXEMHANGKHONGTHU");
        requestBody.put("client_order_code", order.getOrderCode());
        requestBody.put("to_name", order.getShippingName());
        requestBody.put("to_phone", order.getShippingPhone());
        requestBody.put("to_address", String.join(", ", order.getShippingStreet(), order.getShippingWard(),
                order.getShippingDistrict(), order.getShippingProvince()));
        requestBody.put("to_ward_code", toWardCode);
        requestBody.put("to_district_id", toDistrictId);
        requestBody.put("cod_amount", order.getPaymentMethod().name().equals("COD")
                ? order.getFinalAmount().intValue() : 0);
        requestBody.put("content", "Đơn hàng " + order.getOrderCode());
        requestBody.put("weight", Math.max(1000, order.getItems().stream()
                .mapToInt(item -> item.getQuantity() * 1000).sum()));
        requestBody.put("length", 30);
        requestBody.put("width", 20);
        requestBody.put("height", 15);
        requestBody.put("service_type_id", 2);
        requestBody.put("items", items);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, createHeaders());
        ResponseEntity<Object> response = restTemplate.exchange(createOrderUrl, HttpMethod.POST, entity, Object.class);
        if (!(response.getBody() instanceof Map<?, ?> body)
                || !(body.get("data") instanceof Map<?, ?> data)
                || data.get("order_code") == null) {
            throw new BadRequestException("GHN không trả về mã vận đơn hợp lệ.");
        }

        return GhnCreateOrderResult.builder()
                .providerOrderCode(data.get("order_code").toString())
                .providerStatus("ready_to_pick")
                .shippingFee(toBigDecimal(data.get("total_fee")))
                .expectedDeliveryAt(toInstant(data.get("expected_delivery_time")))
                .rawResponse(writeJson(body))
                .build();
    }

    private BigDecimal toBigDecimal(Object value) {
        return value == null ? BigDecimal.ZERO : new BigDecimal(value.toString());
    }

    private Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Instant.parse(value.toString());
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return "{}";
        }
    }
}
