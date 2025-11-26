"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const auth_1 = require("../types/auth");
const router = (0, express_1.Router)();
router.post('/signup', authController_1.default.signup);
router.post('/login', authController_1.default.login);
router.get('/profile', auth_1.auth, authController_1.default.getProfile);
router.put('/profile', auth_1.auth, authController_1.default.updateProfile);
router.put('/change-password', auth_1.auth, authController_1.default.changePassword);
exports.default = router;
