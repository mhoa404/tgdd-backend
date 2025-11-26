"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.default = {
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcryptjs_1.default.hash(user.password, 10);
            const result = yield database_1.default.query(`INSERT INTO users (first_name, last_name, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [
                user.first_name,
                user.last_name,
                user.email,
                hashedPassword,
                user.role || "user",
            ]);
            return result.rows[0];
        });
    },
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query("SELECT * FROM users WHERE email = $1", [
                email,
            ]);
            return result.rows[0] || null;
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query("SELECT * FROM users WHERE id = $1", [id]);
            return result.rows[0] || null;
        });
    },
    updateProfile(userId, profileData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { first_name, last_name, email, phone, address, birth_date, gender, avatar, } = profileData;
            const result = yield database_1.default.query(`UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, phone = $4,
           address = $5, birth_date = $6, gender = $7, avatar = $8
       WHERE id = $9
       RETURNING *`, [
                first_name,
                last_name,
                email,
                phone,
                address,
                birth_date,
                gender,
                avatar,
                userId,
            ]);
            return result.rows[0] || null;
        });
    },
    verifyPassword(userId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findById(userId);
            if (!user)
                return false;
            return bcryptjs_1.default.compare(password, user.password);
        });
    },
    changePassword(userId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
            const result = yield database_1.default.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, userId]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    },
};
