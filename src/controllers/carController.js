import * as carService from "../services/carService.js";
import * as uploadService from "../services/uploadService.js";
import { recordActivity } from "../services/auditService.js";

export async function listCars(req, res) {
  const isAdminOrSales = req.user && ["admin", "sales"].includes(req.user.role);
  const result = await carService.listCars(req.query, isAdminOrSales);
  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
}

export async function getCar(req, res) {
  const isAdminOrSales = req.user && ["admin", "sales"].includes(req.user.role);
  const car = await carService.getCar(req.params.id, isAdminOrSales);
  res.json({
    success: true,
    data: car
  });
}

export async function createCar(req, res) {
  const car = await carService.createCar(req.body);

  await recordActivity({
    userId: req.user.id,
    action: "create_car",
    entityType: "car",
    entityId: car.id,
    newValues: car,
    req
  });

  res.status(201).json({
    success: true,
    message: "Tạo thông tin xe thành công.",
    data: car
  });
}

export async function updateCar(req, res) {
  const car = await carService.updateCar(req.params.id, req.body);

  await recordActivity({
    userId: req.user.id,
    action: "update_car",
    entityType: "car",
    entityId: car.id,
    newValues: car,
    req
  });

  res.json({
    success: true,
    message: "Cập nhật thông tin xe thành công.",
    data: car
  });
}

export async function deleteCar(req, res) {
  await carService.deleteCar(req.params.id);

  await recordActivity({
    userId: req.user.id,
    action: "delete_car",
    entityType: "car",
    entityId: req.params.id,
    req
  });

  res.json({
    success: true,
    message: "Đã xóa ô tô thành công."
  });
}

export async function compareCars(req, res) {
  const { carIds } = req.body;
  const cars = await carService.compareCars(carIds);
  res.json({
    success: true,
    data: cars
  });
}

export async function uploadImages(req, res) {
  const carId = req.params.id;
  const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
  const images = await uploadService.addCarImages(carId, files);
  res.status(201).json({
    success: true,
    message: `Đã tải lên ${images.length} hình ảnh thành công.`,
    data: images
  });
}

export async function getImages(req, res) {
  const carId = req.params.id;
  const images = await uploadService.getCarImages(carId);
  res.json({
    success: true,
    data: images
  });
}

export async function deleteImage(req, res) {
  const { id: carId, imageId } = req.params;
  const result = await uploadService.deleteCarImage(carId, imageId);
  res.json({
    success: true,
    message: result.message
  });
}

export async function setPrimaryImage(req, res) {
  const { id: carId, imageId } = req.params;
  const result = await uploadService.setPrimaryImage(carId, imageId);
  res.json({
    success: true,
    message: result.message
  });
}
