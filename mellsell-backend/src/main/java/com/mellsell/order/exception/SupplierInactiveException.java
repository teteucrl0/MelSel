package com.mellsell.order.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class SupplierInactiveException extends RuntimeException {
    public SupplierInactiveException(String message) {
        super(message);
    }
}
