import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({
  env: { WA_API_URL: "https://csai.uika-bogor.ac.id/api/v1", WA_API_TOKEN: "kunci-uji" },
}));

const { kirimWa, kirimWaBerurutan, cekStatusWa } = await import("./wa");

describe("kirimWa — kontrak API ChatLoop", () => {
  const fetchAsli = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = fetchAsli;
    vi.restoreAllMocks();
  });

  it("POST ke {base}/messages dengan nomor format internasional dan type text", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(null, { status: 200 }) as unknown as Response,
    );

    const hasil = await kirimWa("0813-8315-5797", "Halo");

    expect(hasil).toEqual({ terkirim: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://csai.uika-bogor.ac.id/api/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer kunci-uji",
        }),
        body: JSON.stringify({ to: "6281383155797", type: "text", text: "Halo" }),
      }),
    );
  });

  it("401 API key salah/hilang -> tidak terkirim, alasan dari body.error", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "API key tidak ada" }), { status: 401 }) as unknown as Response,
    );

    const hasil = await kirimWa("081200000000", "Halo");
    expect(hasil.terkirim).toBe(false);
    expect(hasil.alasan).toBe("API key tidak ada");
  });

  it("429 rate limit -> retryAfterDetik diisi dari header Retry-After", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Terlalu banyak permintaan" }), {
        status: 429,
        headers: { "Retry-After": "30" },
      }) as unknown as Response,
    );

    const hasil = await kirimWa("081200000000", "Halo");
    expect(hasil.terkirim).toBe(false);
    expect(hasil.retryAfterDetik).toBe(30);
  });

  it("gagal konek (fetch throw) -> tidak terkirim, tidak melempar error", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

    const hasil = await kirimWa("081200000000", "Halo");
    expect(hasil).toEqual({ terkirim: false, alasan: "network down" });
  });
});

describe("kirimWaBerurutan — throttle & retry untuk cron massal", () => {
  const fetchAsli = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = fetchAsli;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("kena 429 -> tunggu retryAfterDetik lalu retry sekali, lalu jeda sebelum resolve", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Terlalu banyak permintaan" }), {
          status: 429,
          headers: { "Retry-After": "3" },
        }) as unknown as Response,
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }) as unknown as Response);

    const promise = kirimWaBerurutan("081200000000", "Halo");
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(1100);

    expect(await promise).toEqual({ terkirim: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("sukses langsung -> tetap menunggu jeda antar pesan sebelum resolve", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 200 }) as unknown as Response);

    const promise = kirimWaBerurutan("081200000000", "Halo");
    await vi.advanceTimersByTimeAsync(1100);

    expect(await promise).toEqual({ terkirim: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("cekStatusWa — kontrak GET /status ChatLoop", () => {
  const fetchAsli = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = fetchAsli;
    vi.restoreAllMocks();
  });

  it("connected: true -> tersambung true, bawa nomor & nama CS", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ agent_id: 1, number: "628111111111", name: "CS Utama", connected: true }),
        { status: 200 },
      ) as unknown as Response,
    );

    const hasil = await cekStatusWa();
    expect(hasil).toEqual({ tersambung: true, nomor: "628111111111", nama: "CS Utama" });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://csai.uika-bogor.ac.id/api/v1/status",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer kunci-uji" }) }),
    );
  });

  it("401 -> tersambung false, alasan dari body.error", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "API key tidak ada" }), { status: 401 }) as unknown as Response,
    );

    const hasil = await cekStatusWa();
    expect(hasil).toEqual({ tersambung: false, alasan: "API key tidak ada" });
  });
});
