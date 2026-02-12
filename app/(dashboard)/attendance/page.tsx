"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Search, Filter, LogIn, LogOut as LogOutIcon, MapPin, Loader2, Trash2 } from "lucide-react";

interface AttendanceRecord {
    id: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: "Present" | "Late" | "Absent" | "Half Day";
    workHours: string;
    location?: string;
    checkInLocation?: LocationData;
    checkOutLocation?: LocationData;
}

interface LocationData {
    latitude: number;
    longitude: number;
    address?: string;
}

interface TodayAttendance {
    checkInTime: string | null;
    checkOutTime: string | null;
    checkInLocation: LocationData | null;
    checkOutLocation: LocationData | null;
    date: string;
}

export default function AttendancePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
    const [checkInLocation, setCheckInLocation] = useState<LocationData | null>(null);
    const [checkOutLocation, setCheckOutLocation] = useState<LocationData | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

    // Load data from localStorage on mount
    useEffect(() => {
        // Load today's attendance
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const todayKey = `attendance_today_${todayStr}`;
        const savedToday = localStorage.getItem(todayKey);

        if (savedToday) {
            const todayData: TodayAttendance = JSON.parse(savedToday);
            setCheckInTime(todayData.checkInTime);
            setCheckOutTime(todayData.checkOutTime);
            setCheckInLocation(todayData.checkInLocation);
            setCheckOutLocation(todayData.checkOutLocation);
            setIsCheckedIn(!!todayData.checkInTime && !todayData.checkOutTime);
        }

        // Load all attendance records
        const savedRecords = localStorage.getItem("attendance_records");
        if (savedRecords) {
            setAttendanceRecords(JSON.parse(savedRecords));
        }
    }, []);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Save today's attendance to localStorage
    const saveTodayAttendance = (data: Partial<TodayAttendance>) => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const todayKey = `attendance_today_${todayStr}`;
        const existing = localStorage.getItem(todayKey);
        const existingData: TodayAttendance = existing ? JSON.parse(existing) : {
            checkInTime: null,
            checkOutTime: null,
            checkInLocation: null,
            checkOutLocation: null,
            date: today,
        };

        const updatedData = { ...existingData, ...data };
        localStorage.setItem(todayKey, JSON.stringify(updatedData));
    };

    // Calculate work hours
    const calculateWorkHours = (checkIn: string, checkOut: string): string => {
        if (!checkIn || !checkOut || checkIn === "-" || checkOut === "-") {
            return "0h 0m";
        }

        try {
            // Handle both colon (:) and dot (.) separators
            const separatorPattern = /[:.]/;
            const inParts = checkIn.split(separatorPattern);
            const outParts = checkOut.split(separatorPattern);

            const inHour = parseInt(inParts[0], 10);
            const inMinute = parseInt(inParts[1], 10);
            const outHour = parseInt(outParts[0], 10);
            const outMinute = parseInt(outParts[1], 10);

            // Validate parsed numbers
            if (isNaN(inHour) || isNaN(inMinute) || isNaN(outHour) || isNaN(outMinute)) {
                console.error("Invalid time format detected:", { checkIn, checkOut });
                return "0h 0m";
            }

            const inMinutes = inHour * 60 + inMinute;
            const outMinutes = outHour * 60 + outMinute;
            const diffMinutes = outMinutes - inMinutes;

            if (diffMinutes < 0) {
                return "0h 0m";
            }

            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;

            return `${hours}h ${minutes}m`;
        } catch (error) {
            console.error("Error calculating work hours:", error);
            return "0h 0m";
        }
    };

    // Determine status based on check-in time
    const determineStatus = (checkIn: string, checkOut: string): "Present" | "Late" | "Half Day" => {
        if (!checkIn || checkIn === "-") {
            return "Late";
        }

        try {
            // Handle both colon (:) and dot (.) separators
            const separatorPattern = /[:.]/;
            const parts = checkIn.trim().split(separatorPattern);
            const hour = parseInt(parts[0], 10);

            if (isNaN(hour)) {
                return "Late";
            }

            if (!checkOut || checkOut === "-") {
                return hour > 8 ? "Late" : "Present";
            }

            const workHours = calculateWorkHours(checkIn, checkOut);
            const totalHours = parseInt(workHours.split("h")[0]);

            if (isNaN(totalHours)) {
                return hour > 8 ? "Late" : "Present";
            }

            if (totalHours < 5) {
                return "Half Day";
            }

            return hour > 8 ? "Late" : "Present";
        } catch (error) {
            console.error("Error determining status:", error);
            return "Late";
        }
    };

    // Save attendance record
    const saveAttendanceRecord = (checkIn: string, checkOut: string, checkInLoc: LocationData | null, checkOutLoc: LocationData | null) => {
        // Validate inputs (only checkIn is strictly required now)
        if (!checkIn || checkIn === "-") {
            console.error("Cannot save record: invalid check-in time", { checkIn });
            return;
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const workHours = calculateWorkHours(checkIn, checkOut);
        const status = determineStatus(checkIn, checkOut);

        const newRecord: AttendanceRecord = {
            id: Date.now().toString(),
            date: todayStr,
            checkIn,
            checkOut,
            status,
            workHours,
            location: checkInLoc?.address || "-",
            checkInLocation: checkInLoc || undefined,
            checkOutLocation: checkOutLoc || undefined,
        };

        const savedRecords = localStorage.getItem("attendance_records");
        const records: AttendanceRecord[] = savedRecords ? JSON.parse(savedRecords) : [];

        // Check if record for today already exists
        const existingIndex = records.findIndex(r => r.date === todayStr);
        if (existingIndex >= 0) {
            // Update existing record but preserve the original ID
            records[existingIndex] = {
                ...newRecord,
                id: records[existingIndex].id
            };
        } else {
            // Add new record at the beginning
            records.unshift(newRecord);
        }

        localStorage.setItem("attendance_records", JSON.stringify(records));
        setAttendanceRecords(records);
    };

    // Get user's current location
    const getCurrentLocation = (): Promise<LocationData> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation tidak didukung oleh browser Anda"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    // Try to get address from coordinates using reverse geocoding
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();

                        resolve({
                            latitude,
                            longitude,
                            address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                        });
                    } catch (error) {
                        // If reverse geocoding fails, just return coordinates
                        resolve({
                            latitude,
                            longitude,
                            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                        });
                    }
                },
                (error) => {
                    reject(new Error("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan."));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    const handleCheckIn = async () => {
        setIsLoadingLocation(true);
        setLocationError(null);

        try {
            const location = await getCurrentLocation();
            const now = new Date();
            const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":");

            setCheckInTime(timeString);
            setCheckInLocation(location);
            setIsCheckedIn(true);

            // Save to localStorage
            saveTodayAttendance({
                checkInTime: timeString,
                checkInLocation: location,
            });

            // Save record immediately to the table
            saveAttendanceRecord(timeString, "-", location, null);
        } catch (error) {
            setLocationError(error instanceof Error ? error.message : "Gagal mendapatkan lokasi");
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleCheckOut = async () => {
        setIsLoadingLocation(true);
        setLocationError(null);

        try {
            const location = await getCurrentLocation();
            const now = new Date();
            const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":");

            setCheckOutTime(timeString);
            setCheckOutLocation(location);
            setIsCheckedIn(false);

            // Save to localStorage
            saveTodayAttendance({
                checkOutTime: timeString,
                checkOutLocation: location,
            });

            // Save complete attendance record
            if (checkInTime) {
                saveAttendanceRecord(checkInTime, timeString, checkInLocation, location);
            }
        } catch (error) {
            setLocationError(error instanceof Error ? error.message : "Gagal mendapatkan lokasi");
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // Delete attendance record
    const handleDeleteRecord = (id: string) => {
        const confirmed = window.confirm("Apakah Anda yakin ingin menghapus catatan ini?");
        if (confirmed) {
            const updatedRecords = attendanceRecords.filter(record => record.id !== id);
            localStorage.setItem("attendance_records", JSON.stringify(updatedRecords));
            setAttendanceRecords(updatedRecords);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Present":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "Late":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "Absent":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "Half Day":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Present":
                return <CheckCircle className="w-4 h-4" />;
            case "Late":
                return <Clock className="w-4 h-4" />;
            case "Absent":
                return <XCircle className="w-4 h-4" />;
            case "Half Day":
                return <Clock className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const filteredRecords = attendanceRecords.filter((record) => {
        const matchesSearch = record.date.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || record.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            {/* Check-In/Out Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
                <div className="flex flex-col gap-6">
                    {/* Current Time Display */}
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Waktu Saat Ini</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {currentTime.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </p>
                        </div>
                    </div>

                    {/* Location Error */}
                    {locationError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{locationError}</p>
                        </div>
                    )}

                    {/* Check-In/Out Status with Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {checkInTime && checkInLocation && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Check In</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{checkInTime}</p>
                                        <div className="flex items-start gap-1 mt-2">
                                            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {checkInLocation.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {checkOutTime && checkOutLocation && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Check Out</p>
                                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{checkOutTime}</p>
                                        <div className="flex items-start gap-1 mt-2">
                                            <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {checkOutLocation.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Check-In/Out Buttons */}
                    <div className="flex gap-3">
                        {!isCheckedIn ? (
                            <button
                                onClick={handleCheckIn}
                                disabled={isLoadingLocation}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingLocation ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Mendapatkan Lokasi...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4" />
                                        Check In
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleCheckOut}
                                disabled={isLoadingLocation}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingLocation ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Mendapatkan Lokasi...
                                    </>
                                ) : (
                                    <>
                                        <LogOutIcon className="w-4 h-4" />
                                        Check Out
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Kehadiran</h2>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan tanggal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-10 pr-8 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                            <option value="all">Semua Status</option>
                            <option value="Present">Hadir</option>
                            <option value="Late">Terlambat</option>
                            <option value="Absent">Tidak Hadir</option>
                            <option value="Half Day">Setengah Hari</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="text-left p-3 font-semibold dark:text-gray-300">
                                    Tanggal
                                </th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">
                                    Check In
                                </th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">
                                    Check Out
                                </th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">
                                    Jam Kerja
                                </th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">
                                    Lokasi
                                </th>
                                <th className="text-left p-3 font-semibold dark:text-gray-300">
                                    Status
                                </th>
                                <th className="text-right p-3 font-semibold dark:text-gray-300">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-8 text-center text-gray-500 dark:text-gray-400"
                                    >
                                        Tidak ada data kehadiran yang ditemukan
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <td className="p-3 font-medium dark:text-white">
                                            {new Date(record.date).toLocaleDateString("id-ID", {
                                                weekday: "short",
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                        <td className="p-3 dark:text-gray-300">{record.checkIn}</td>
                                        <td className="p-3 dark:text-gray-300">{record.checkOut}</td>
                                        <td className="p-3 dark:text-gray-300 font-medium">
                                            {record.workHours}
                                        </td>
                                        <td className="p-3 dark:text-gray-300">
                                            {record.location ? (
                                                <div className="flex items-start gap-1">
                                                    <MapPin className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                                                    <span className="text-xs line-clamp-2">{record.location}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    record.status
                                                )}`}
                                            >
                                                {getStatusIcon(record.status)}
                                                {record.status === "Present" && "Hadir"}
                                                {record.status === "Late" && "Terlambat"}
                                                {record.status === "Absent" && "Tidak Hadir"}
                                                {record.status === "Half Day" && "Setengah Hari"}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleDeleteRecord(record.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Hapus catatan"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredRecords.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t dark:border-gray-700 gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Menampilkan{" "}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {filteredRecords.length}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {attendanceRecords.length}
                            </span>{" "}
                            catatan
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
