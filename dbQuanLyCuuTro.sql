USE master
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'DB_CuuTroLuLut_HoaVang')
BEGIN
    DROP DATABASE DB_CuuTroLuLut_HoaVang
END
GO

CREATE DATABASE DB_CuuTroLuLut_HoaVang
GO

USE DB_CuuTroLuLut_HoaVang
GO

-- =========================
-- 1. DANH MỤC
-- =========================

CREATE TABLE TinhThanhPho(
    MaTinhThanhPho VARCHAR(10) PRIMARY KEY,
    TenTinhThanhPho NVARCHAR(100) NOT NULL
)

CREATE TABLE PhuongXa(
    MaPhuongXa VARCHAR(10) PRIMARY KEY,
    TenPhuongXa NVARCHAR(100),
    MaTinhThanhPho VARCHAR(10) REFERENCES TinhThanhPho(MaTinhThanhPho)
)

CREATE TABLE ThonToDanPho(
    MaThonToDanPho VARCHAR(10) PRIMARY KEY,
    TenThonToDanPho NVARCHAR(100),
    MaPhuongXa VARCHAR(10) REFERENCES PhuongXa(MaPhuongXa)
)

CREATE TABLE VaiTro(
    MaVaiTro VARCHAR(10) PRIMARY KEY,
    TenVaiTro NVARCHAR(100),
    TrangThai NVARCHAR(50)
)


CREATE TABLE LoaiHang(
    MaLoaiHang VARCHAR(10) PRIMARY KEY,
    TenLoaiHang NVARCHAR(100),
    DonViTinh NVARCHAR(50)
)

CREATE TABLE DotCuuTro(
    MaDot VARCHAR(10) PRIMARY KEY,
    TenDot NVARCHAR(100),
    MoTa NVARCHAR(MAX),
    NgayBatDau DATETIME,
    NgayKetThuc DATETIME,
    TrangThai NVARCHAR(50),
    HinhAnh NVARCHAR(500),
    CONSTRAINT CK_Dot CHECK (NgayKetThuc >= NgayBatDau)
)

CREATE TABLE Suat(
    MaSuat VARCHAR(10) PRIMARY KEY,
    TenSuat NVARCHAR(50)
)

-- =========================
-- 2. NGƯỜI DÙNG
-- =========================

CREATE TABLE NguoiDung(
    MaNguoiDung VARCHAR(10) PRIMARY KEY,
    HoTen NVARCHAR(100),
    Email NVARCHAR(100) UNIQUE,
    SoDienThoai VARCHAR(15) UNIQUE,
    MatKhau VARCHAR(100),
    DiaChiCuThe NVARCHAR(255),
    MaThonToDanPho VARCHAR(10) REFERENCES ThonToDanPho(MaThonToDanPho),
    MaVaiTro VARCHAR(10) REFERENCES VaiTro(MaVaiTro),
    TrangThai NVARCHAR(50) NOT NULL CONSTRAINT DF_NguoiDung_TrangThai DEFAULT (N'Hoạt động')
)

-- =========================
-- 3. HÀNG HÓA
-- =========================

CREATE TABLE HangCuuTro(
    MaHang VARCHAR(10) PRIMARY KEY,
    TenHang NVARCHAR(200),
    MaLoaiHang VARCHAR(10) REFERENCES LoaiHang(MaLoaiHang),
    SoLuongTon FLOAT DEFAULT 0 CHECK (SoLuongTon >= 0),
    MoTa NVARCHAR(500)
)

CREATE TABLE ChiTietSuat(
    MaSuat VARCHAR(10),
    MaHang VARCHAR(10),
    SoLuong INT CHECK (SoLuong > 0),
    PRIMARY KEY (MaSuat, MaHang),
    FOREIGN KEY (MaSuat) REFERENCES Suat(MaSuat),
    FOREIGN KEY (MaHang) REFERENCES HangCuuTro(MaHang)
)

-- =========================
-- 4. ỦNG HỘ
-- =========================

CREATE TABLE UngHo(
    MaUngHo VARCHAR(10) PRIMARY KEY,
    MaNguoiDung VARCHAR(10) REFERENCES NguoiDung(MaNguoiDung),
    MaDot VARCHAR(10) REFERENCES DotCuuTro(MaDot),
    NgayUngHo DATETIME DEFAULT GETDATE(),
    TrangThai NVARCHAR(50),
    HinhAnh NVARCHAR(500)
)

CREATE TABLE ChiTietUngHoHang(
    MaCTUHHang INT IDENTITY PRIMARY KEY,
    MaUngHo VARCHAR(10),
    MaHang VARCHAR(10),
    SoLuong FLOAT CHECK (SoLuong > 0),
    FOREIGN KEY (MaUngHo) REFERENCES UngHo(MaUngHo),
    FOREIGN KEY (MaHang) REFERENCES HangCuuTro(MaHang)
)

CREATE TABLE ChiTietUngHoSuat(
    MaCTUHSuat VARCHAR(10) PRIMARY KEY,
    MaUngHo VARCHAR(10),
    MaSuat VARCHAR(10),
    SoLuongSuat INT CHECK (SoLuongSuat > 0),
    FOREIGN KEY (MaUngHo) REFERENCES UngHo(MaUngHo),
    FOREIGN KEY (MaSuat) REFERENCES Suat(MaSuat)
)

-- =========================
-- 5. KHO
-- =========================

-- Thông tin xe của người vận chuyển (1-1 với NguoiDung VT04)
CREATE TABLE TaiXe(
    MaTaiXe VARCHAR(10) PRIMARY KEY,
    MaNguoiDung VARCHAR(10) UNIQUE REFERENCES NguoiDung(MaNguoiDung),
    BienSoXe VARCHAR(20) NOT NULL,
    LoaiXe NVARCHAR(100),
    TaiTrong NVARCHAR(50),
    TrangThai NVARCHAR(50) DEFAULT N'Hoạt động'
)

CREATE TABLE PhieuNhap(
    MaPhieuNhap VARCHAR(10) PRIMARY KEY,
    MaNguoiDung VARCHAR(10),
    MaUngHo VARCHAR(10),
    NguoiVanChuyen VARCHAR(10),
    NguonHang NVARCHAR(200),
    TrangThai NVARCHAR(50) DEFAULT N'Chờ xác nhận',
    NgayNhap DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (NguoiVanChuyen) REFERENCES NguoiDung(MaNguoiDung)
)

CREATE TABLE ChiTietPhieuNhap(
    MaChiTietPhieuNhap VARCHAR(10) PRIMARY KEY,
    MaPhieuNhap VARCHAR(10),
    MaHang VARCHAR(10),
    SoLuongChungTu FLOAT,
    SoLuongThucNhap FLOAT,
    ChenhLech FLOAT,
    FOREIGN KEY (MaPhieuNhap) REFERENCES PhieuNhap(MaPhieuNhap),
    FOREIGN KEY (MaHang) REFERENCES HangCuuTro(MaHang)
)

CREATE TABLE PhieuXuat(
    MaPhieuXuat VARCHAR(10) PRIMARY KEY,
    NgayXuat DATETIME,
    MaNguoiLap VARCHAR(10),
    MaNguoiVanChuyen VARCHAR(10),
    MaDot VARCHAR(10),
    TrangThai NVARCHAR(50),
    MaXacNhan VARCHAR(10),
    FOREIGN KEY (MaNguoiLap) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaNguoiVanChuyen) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaDot) REFERENCES DotCuuTro(MaDot)
)

CREATE TABLE ChiTietPhieuXuat(
    MaChiTietPhieuXuat VARCHAR(10) PRIMARY KEY,
    MaPhieuXuat VARCHAR(10),
    MaHang VARCHAR(10),
    SoLuong FLOAT,
    FOREIGN KEY (MaPhieuXuat) REFERENCES PhieuXuat(MaPhieuXuat),
    FOREIGN KEY (MaHang) REFERENCES HangCuuTro(MaHang)
)

-- =========================
-- 6. CỨU TRỢ
-- =========================

CREATE TABLE YeuCauCuuTro(
    MaYeuCau VARCHAR(10) PRIMARY KEY,
    MaNguoiDung VARCHAR(10),
    MaDot VARCHAR(10),
    NoiDung NVARCHAR(MAX),
    TrangThai NVARCHAR(50),
    MucDoUuTien NVARCHAR(50),
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaDot) REFERENCES DotCuuTro(MaDot)
)

CREATE TABLE LichSuCapPhat(
    MaCapPhat VARCHAR(10) PRIMARY KEY,
    MaThonToDanPho VARCHAR(10),
    MaDot VARCHAR(10),
    MaHang VARCHAR(10),
    SoLuong FLOAT,
    TrangThai NVARCHAR(50),
    FOREIGN KEY (MaThonToDanPho) REFERENCES ThonToDanPho(MaThonToDanPho),
    FOREIGN KEY (MaDot) REFERENCES DotCuuTro(MaDot),
    FOREIGN KEY (MaHang) REFERENCES HangCuuTro(MaHang)
)

-- =========================
-- 7. BỔ SUNG (QUAN TRỌNG)
-- =========================

-- Thông báo
CREATE TABLE ThongBao(
    MaThongBao VARCHAR(10) PRIMARY KEY,
    TieuDe NVARCHAR(200),
    NoiDung NVARCHAR(MAX),
    NgayDang DATETIME DEFAULT GETDATE(),
    MaDot VARCHAR(10),
    FOREIGN KEY (MaDot) REFERENCES DotCuuTro(MaDot)
)

-- Lịch sử trạng thái vận chuyển
CREATE TABLE LichSuTrangThaiPhieuXuat(
    MaLS INT IDENTITY PRIMARY KEY,
    MaPhieuXuat VARCHAR(10),
    TrangThai NVARCHAR(50),
    ThoiGian DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MaPhieuXuat) REFERENCES PhieuXuat(MaPhieuXuat)
)

-- =========================
-- 8. INDEX (CHO WEB)
-- =========================

CREATE INDEX IX_UngHo_User ON UngHo(MaNguoiDung)
CREATE INDEX IX_YeuCau_Dot ON YeuCauCuuTro(MaDot)
CREATE INDEX IX_PhieuXuat_Dot ON PhieuXuat(MaDot)

-- =========================
-- 1. TinhThanhPho
-- =========================
INSERT INTO TinhThanhPho (MaTinhThanhPho, TenTinhThanhPho) VALUES
('T1', N'Đà Nẵng'),
('T2', N'Quảng Nam'),
('T3', N'Huế'),
('T4', N'Hà Nội'),
('T5', N'HCM')

-- =========================
-- 2. PhuongXa
-- =========================
INSERT INTO PhuongXa (MaPhuongXa, TenPhuongXa, MaTinhThanhPho) VALUES
('PX1', N'Hòa Phước', 'T1'),
('PX2', N'Hòa Châu', 'T1'),
('PX3', N'Hòa Tiến', 'T1'),
('PX4', N'Tam Kỳ', 'T2'),
('PX5', N'Hương Thủy', 'T3')

-- =========================
-- 3. ThonToDanPho
-- =========================
INSERT INTO ThonToDanPho (MaThonToDanPho, TenThonToDanPho, MaPhuongXa) VALUES
('TT1', N'Thôn 1', 'PX1'),
('TT2', N'Thôn 2', 'PX2'),
('TT3', N'Thôn 3', 'PX3'),
('TT4', N'Thôn 4', 'PX4'),
('TT5', N'Thôn 5', 'PX5')

-- =========================
-- 4. LoaiHang
-- =========================
INSERT INTO LoaiHang (MaLoaiHang, TenLoaiHang, DonViTinh) VALUES
('LH1', N'Lương thực', N'Kg'),
('LH2', N'Nước uống', N'Chai'),
('LH3', N'Thuốc', N'Hộp'),
('LH4', N'Quần áo', N'Cái'),
('LH5', N'Đồ dùng', N'Bộ')

-- =========================
-- 5. DotCuuTro
-- =========================
INSERT INTO DotCuuTro 
(MaDot, TenDot, MoTa, NgayBatDau, NgayKetThuc, TrangThai, HinhAnh)
VALUES 
('D1', N'Đợt cứu trợ lũ lụt miền Trung', N'Hỗ trợ lũ lụt', 
 '2025-01-01', '2025-01-10', N'Đã kết thúc', 
 '../assets/images/recipient/campaigns/lu_lut.svg'),

('D2', N'Đợt cứu trợ bão', N'Hỗ trợ vùng bão', 
 '2025-02-01', '2025-02-15', N'Đang vận động', 
 '../assets/images/recipient/campaigns/bao.svg'),

('D3', N'Đợt cứu trợ hạn hán', N'Cung cấp nước sạch', 
 '2025-03-01', '2025-03-20', N'Đang phân bổ', 
 '../assets/images/recipient/campaigns/han_han.svg'),

('D4', N'Đợt hỗ trợ mưa lớn', N'Hỗ trợ khẩn cấp', 
 '2025-04-01', '2025-04-10', N'Đang vận động', 
 '../assets/images/recipient/campaigns/mua_lon.svg'),

('D5', N'Đợt hỗ trợ mưa đá ', N'Cung cấp nhân lực sửa nhà', 
 '2025-05-01', '2025-05-15', N'Đang phân bổ', 
 '../assets/images/recipient/campaigns/mua_da.svg');

-- =========================
-- 6. Suat
-- =========================
INSERT INTO Suat (MaSuat, TenSuat) VALUES
('S1', N'Suất 100k'),
('S2', N'Suất 200k'),
('S3', N'Suất 300k'),
('S4', N'Suất 500k'),
('S5', N'Suất VIP')

-- VaiTro
INSERT INTO VaiTro (MaVaiTro, TenVaiTro, TrangThai) VALUES
('VT01', N'Admin', N'Hoạt động'),
('VT02', N'Nhân viên kho', N'Hoạt động'),
('VT03', N'Người dân', N'Hoạt động'),
('VT04', N'Người vận chuyển', N'Hoạt động'),
('VT05', N'Người ủng hộ', N'Hoạt động'),
('VT06', N'Trưởng thôn', N'Hoạt động')

-- =========================
-- 7. NguoiDung
-- =========================
INSERT INTO NguoiDung (MaNguoiDung, HoTen, Email, SoDienThoai, MatKhau, DiaChiCuThe, MaThonToDanPho, MaVaiTro) VALUES
('ND1', N'Admin A',        'admin1@gmail.com',    '0900000001', '123', N'ĐN', 'TT1', 'VT01'),
('ND2', N'Thủ kho B',      'kho@gmail.com',       '0900000002', '123', N'ĐN', 'TT2', 'VT02'),
('ND3', N'Người dân C',    'dan1@gmail.com',       '0900000003', '123', N'ĐN', 'TT3', 'VT03'),
('ND4', N'Tài xế D',       'tx@gmail.com',         '0900000004', '123', N'ĐN', 'TT1', 'VT04'),
('ND5', N'Người ủng hộ E', 'ql@gmail.com',         '0900000005', '123', N'ĐN', 'TT2', 'VT05'),
('ND6', N'Trưởng thôn F',  'truongthon@gmail.com', '0900000006', '123', N'ĐN', 'TT2', 'VT06')

-- =========================
-- 7a. TaiXe (thông tin xe của người vận chuyển)
-- =========================
INSERT INTO TaiXe (MaTaiXe, MaNguoiDung, BienSoXe, LoaiXe, TaiTrong, TrangThai) VALUES
('TX1', 'ND4', N'43C-123.45', N'Xe tải nhỏ', N'1.5 tấn', N'Hoạt động')


-- =========================
-- 8. HangCuuTro
-- =========================
INSERT INTO HangCuuTro (MaHang, TenHang, MaLoaiHang, SoLuongTon, MoTa) VALUES
('H1', N'Mì tôm', 'LH1', 100, ''),
('H2', N'Nước suối', 'LH2', 200, ''),
('H3', N'Thuốc cảm', 'LH3', 50, ''),
('H4', N'Áo mưa', 'LH4', 70, ''),
('H5', N'Chăn', 'LH5', 30, '')

-- =========================
-- 9. ChiTietSuat
-- =========================
INSERT INTO ChiTietSuat (MaSuat, MaHang, SoLuong) VALUES
('S1','H1',5),
('S2','H2',10),
('S3','H3',2),
('S4','H4',1),
('S5','H5',1)

-- =========================
-- 10. UngHo
-- =========================
INSERT INTO UngHo (MaUngHo, MaNguoiDung, MaDot, NgayUngHo, TrangThai, HinhAnh) VALUES
('UH1','ND3','D1',GETDATE(),N'Đã tiếp nhận',''),
('UH2','ND3','D2',GETDATE(),N'Chờ tiếp nhận',''),
('UH3','ND1','D1',GETDATE(),N'Đã tiếp nhận',''),
('UH4','ND5','D3',GETDATE(),N'Đã tiếp nhận',''),
('UH5','ND3','D4',GETDATE(),N'Chờ tiếp nhận','')

-- =========================
-- 11. ChiTietUngHoHang
-- =========================
INSERT INTO ChiTietUngHoHang(MaUngHo,MaHang,SoLuong) VALUES
('UH1','H1',10),
('UH2','H2',20),
('UH3','H3',5),
('UH4','H4',3),
('UH5','H5',2)

-- =========================
-- 12. ChiTietUngHoSuat
-- =========================
INSERT INTO ChiTietUngHoSuat VALUES
('CT1','UH1','S1',2),
('CT2','UH2','S2',1),
('CT3','UH3','S3',3),
('CT4','UH4','S4',1),
('CT5','UH5','S5',1)

-- =========================
-- 13. PhieuNhap
-- =========================
INSERT INTO PhieuNhap (MaPhieuNhap, MaNguoiDung, MaUngHo, NguoiVanChuyen, NguonHang, TrangThai, NgayNhap) VALUES
('PN1','ND2','UH1','ND4', N'Người dân C - UH1', N'Đã xác nhận', GETDATE()),
('PN2','ND2','UH2','ND4', N'Người dân C - UH2', N'Chờ xác nhận', GETDATE()),
('PN3','ND2','UH3','ND4', N'Admin A - UH3',     N'Đã xác nhận', GETDATE()),
('PN4','ND2','UH4','ND4', N'Người ủng hộ E - UH4', N'Đã xác nhận', GETDATE()),
('PN5','ND2','UH5','ND4', N'Người dân C - UH5', N'Chờ xác nhận', GETDATE())

-- =========================
-- 14. ChiTietPhieuNhap
-- =========================
INSERT INTO ChiTietPhieuNhap (MaChiTietPhieuNhap, MaPhieuNhap, MaHang, SoLuongChungTu, SoLuongThucNhap, ChenhLech) VALUES
('CTPN1','PN1','H1',10,10,0),
('CTPN2','PN2','H2',20,18,-2),
('CTPN3','PN3','H3',5,5,0),
('CTPN4','PN4','H4',3,3,0),
('CTPN5','PN5','H5',2,2,0)

-- =========================
-- 15. PhieuXuat
-- =========================
INSERT INTO PhieuXuat (MaPhieuXuat, NgayXuat, MaNguoiLap, MaNguoiVanChuyen, MaDot, TrangThai) VALUES
('PX1',GETDATE(),'ND2','ND4','D1',N'Đang vận chuyển'),
('PX2',GETDATE(),'ND2','ND4','D2',N'Đang vận chuyển'),
('PX3',GETDATE(),'ND2','ND4','D3',N'Đang vận chuyển'),
('PX4',GETDATE(),'ND2','ND4','D4',N'Có vấn đề'),
('PX5',GETDATE(),'ND2','ND4','D5',N'Đang vận chuyển')

-- =========================
-- 16. ChiTietPhieuXuat
-- =========================
INSERT INTO ChiTietPhieuXuat (MaChiTietPhieuXuat, MaPhieuXuat, MaHang, SoLuong) VALUES
('CTX1','PX1','H1',5),
('CTX2','PX2','H2',10),
('CTX3','PX3','H3',3),
('CTX4','PX4','H4',2),
('CTX5','PX5','H5',1)

-- =========================
-- 17. YeuCauCuuTro
-- =========================
INSERT INTO YeuCauCuuTro (MaYeuCau, MaNguoiDung, MaDot, NoiDung, TrangThai, MucDoUuTien) VALUES
('YC1','ND3','D1',N'Cần mì',N'Chờ duyệt',N'Cao'),
('YC2','ND3','D2',N'Cần nước',N'Đã duyệt',N'Trung bình'),
('YC3','ND3','D3',N'Cần thuốc',N'Chờ duyệt',N'Cao'),
('YC4','ND3','D4',N'Cần áo',N'Đã từ chối',N'Thấp'),
('YC5','ND3','D5',N'Cần chăn',N'Chờ duyệt',N'Cao')

-- =========================
-- 18. LichSuCapPhat
-- =========================
INSERT INTO LichSuCapPhat (MaCapPhat, MaThonToDanPho, MaDot, MaHang, SoLuong, TrangThai) VALUES
('CP1','TT1','D1','H1',5,N'Chưa nhận'),
('CP2','TT2','D2','H2',10,N'Đã nhận'),
('CP3','TT3','D3','H3',3,N'Chưa nhận'),
('CP4','TT4','D4','H4',2,N'Đã nhận'),
('CP5','TT5','D5','H5',1,N'Chưa nhận')

-- =========================
-- 19. ThongBao
-- =========================
INSERT INTO ThongBao (MaThongBao, TieuDe, NoiDung, NgayDang, MaDot) VALUES
('TB1',N'Thông báo 1',N'Nội dung 1',GETDATE(),'D1'),
('TB2',N'Thông báo 2',N'Nội dung 2',GETDATE(),'D2'),
('TB3',N'Thông báo 3',N'Nội dung 3',GETDATE(),'D3'),
('TB4',N'Thông báo 4',N'Nội dung 4',GETDATE(),'D4'),
('TB5',N'Thông báo 5',N'Nội dung 5',GETDATE(),'D5')

-- =========================
-- 20. LichSuTrangThaiPhieuXuat
-- =========================
INSERT INTO LichSuTrangThaiPhieuXuat (MaPhieuXuat, TrangThai) VALUES
('PX1',N'Đang vận chuyển'),
('PX2',N'Đã hoàn thành'),
('PX3',N'Đang vận chuyển'),
('PX4',N'Có vấn đề'),
('PX5',N'Đang vận chuyển')



-- =========================
-- MIGRATION: Thêm cột MaXacNhan vào PhieuXuat (chạy 1 lần nếu DB đã tồn tại)
-- =========================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'PhieuXuat' AND COLUMN_NAME = 'MaXacNhan'
)
BEGIN
    ALTER TABLE PhieuXuat ADD MaXacNhan VARCHAR(10) NULL;
END
