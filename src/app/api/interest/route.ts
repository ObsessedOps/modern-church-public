import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email, church, role, serve, prayer } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Modern.Church <noreply@modern.church>",
      to: "jake.ganote@gmail.com",
      subject: `New Interest: ${name} from ${church || "Unknown Church"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">New Interest from Demo</h2>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 100px;">Name</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">
                  <a href="mailto:${email}" style="color: #7c3aed; text-decoration: none;">${email}</a>
                </td>
              </tr>
              ${church ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Church</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${church}</td>
              </tr>` : ""}
              ${role ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Role</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${role}</td>
              </tr>` : ""}
            </table>
            ${serve ? `
            <div style="margin-top: 16px; padding: 12px 16px; background: #f1f5f9; border-radius: 8px;">
              <p style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;">How We Can Serve</p>
              <p style="color: #1e293b; font-size: 14px; margin: 0; line-height: 1.5;">${serve}</p>
            </div>` : ""}
            ${prayer ? `
            <div style="margin-top: 12px; padding: 12px 16px; background: #faf5ff; border-radius: 8px; border-left: 3px solid #a855f7;">
              <p style="color: #7c3aed; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;">Prayer Request</p>
              <p style="color: #1e293b; font-size: 14px; margin: 0; line-height: 1.5; font-style: italic;">${prayer}</p>
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
