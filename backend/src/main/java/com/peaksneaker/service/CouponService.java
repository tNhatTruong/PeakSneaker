package com.peaksneaker.service;

import com.peaksneaker.entity.Coupon;

import java.util.List;

public interface CouponService {
    Coupon getCouponById(Long id);
    List<Coupon> getAllCoupons();
    void saveCoupon(Coupon coupon);
    void deleteCoupon(Coupon coupon);
}
