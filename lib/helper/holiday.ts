type NationalHolidayItem = {
  date: string;
  name: string;
};

async function fetchNationalHolidayYear(year: number) {
  const response = await fetch(`https://libur.deno.dev/api?year=${year}`, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil data hari libur tahun ${year}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as NationalHolidayItem[]) : [];
}

export async function getNationalHolidaysByYears(years: number[]) {
  const uniqueYears = Array.from(new Set(years));
  const holidays = await Promise.all(uniqueYears.map(fetchNationalHolidayYear));
  return holidays.flat();
}

export async function getNationalHolidayByDate(dateKey: string) {
  const year = Number(dateKey.slice(0, 4));
  const holidays = await getNationalHolidaysByYears([year]);
  return holidays.find((holiday) => holiday.date === dateKey) ?? null;
}
