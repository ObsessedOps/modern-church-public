import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Rate limiting (10 submissions per IP per hour) ─────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── HTML escaping ──────────────────────────────────────
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  try {
    const { name, email, church, role, serve, prayer, consulting, heardFrom, _hp, _ts } = await req.json();

    // Honeypot check — bots fill hidden fields
    if (_hp) {
      return NextResponse.json({ success: true }); // silent reject
    }

    // Timestamp check — reject if submitted in under 2 seconds
    if (_ts && Date.now() - _ts < 2000) {
      return NextResponse.json({ success: true }); // silent reject
    }

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Basic input length limits
    if (name.length > 200 || email.length > 200 || (church && church.length > 300) || (role && role.length > 300) || (serve && serve.length > 2000) || (prayer && prayer.length > 2000) || (heardFrom && heardFrom.length > 500)) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    // Escape all user input for HTML email
    const s = {
      name: esc(name),
      email: esc(email),
      church: church ? esc(church) : "",
      role: role ? esc(role) : "",
      serve: serve ? esc(serve) : "",
      prayer: prayer ? esc(prayer) : "",
      heardFrom: heardFrom ? esc(heardFrom) : "",
    };

    await resend.emails.send({
      from: "Modern.Church <noreply@modern.church>",
      to: "jake.ganote@gmail.com",
      subject: `New Interest: ${s.name} from ${s.church || "Unknown Church"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">New Interest from Demo</h2>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 100px;">Name</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${s.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">
                  <a href="mailto:${s.email}" style="color: #7c3aed; text-decoration: none;">${s.email}</a>
                </td>
              </tr>
              ${s.church ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Church</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${s.church}</td>
              </tr>` : ""}
              ${s.role ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Role</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${s.role}</td>
              </tr>` : ""}
              ${s.heardFrom ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Heard From</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${s.heardFrom}</td>
              </tr>` : ""}
            </table>
            ${consulting ? `
            <div style="margin-top: 16px; padding: 10px 16px; background: #f5f3ff; border-radius: 8px; border: 1px solid #ddd6fe;">
              <p style="color: #7c3aed; font-size: 13px; font-weight: 600; margin: 0;">Interested in Consulting Services</p>
            </div>` : ""}
            ${s.serve ? `
            <div style="margin-top: 16px; padding: 12px 16px; background: #f1f5f9; border-radius: 8px;">
              <p style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;">How We Can Serve</p>
              <p style="color: #1e293b; font-size: 14px; margin: 0; line-height: 1.5;">${s.serve}</p>
            </div>` : ""}
            ${s.prayer ? `
            <div style="margin-top: 12px; padding: 12px 16px; background: #faf5ff; border-radius: 8px; border-left: 3px solid #a855f7;">
              <p style="color: #7c3aed; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;">Prayer Request</p>
              <p style="color: #1e293b; font-size: 14px; margin: 0; line-height: 1.5; font-style: italic;">${s.prayer}</p>
            </div>` : ""}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Submitted from the Modern.Church demo at ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interest form error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
