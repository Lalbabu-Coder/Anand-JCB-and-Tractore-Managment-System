import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM_NUMBER || "whatsapp:+14155238886"; // Default Twilio sandbox whatsapp

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error);
  }
}

export interface SmsTemplateVariables {
  customerName: string;
  hours?: string | number;
  rate?: string | number;
  total: string | number;
  advance: string | number;
  remaining: string | number;
  workType?: string;
  area?: string | number;
}

export function parseTemplate(template: string, vars: SmsTemplateVariables): string {
  let parsed = template;
  parsed = parsed.replace(/{customerName}/g, vars.customerName);
  parsed = parsed.replace(/{total}/g, String(vars.total));
  parsed = parsed.replace(/{advance}/g, String(vars.advance));
  parsed = parsed.replace(/{remaining}/g, String(vars.remaining));

  if (vars.hours !== undefined) parsed = parsed.replace(/{hours}/g, String(vars.hours));
  if (vars.rate !== undefined) parsed = parsed.replace(/{rate}/g, String(vars.rate));
  if (vars.workType !== undefined) parsed = parsed.replace(/{workType}/g, vars.workType);
  if (vars.area !== undefined) parsed = parsed.replace(/{area}/g, String(vars.area));

  return parsed;
}

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; id?: string; error?: string }> {
  // Format mobile to include country code (+91 for India if exactly 10 digits)
  const formattedTo = to.startsWith("+") ? to : to.length === 10 ? `+91${to}` : to;

  if (!client || !fromNumber) {
    console.log("\n================[MOCK SMS SEND]================");
    console.log(`To: ${formattedTo}`);
    console.log(`Body:\n${body}`);
    console.log("================================================\n");
    return { success: true, id: `mock-sms-${Date.now()}` };
  }

  try {
    const res = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });
    return { success: true, id: res.sid };
  } catch (error: unknown) {
    console.error("Twilio SMS send error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendWhatsApp(to: string, body: string, mediaUrl?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to.startsWith("+") ? to : to.length === 10 ? `+91${to}` : to}`;

  if (!client) {
    console.log("\n=============[MOCK WHATSAPP SEND]=============");
    console.log(`To: ${formattedTo}`);
    if (mediaUrl) console.log(`Media URL: ${mediaUrl}`);
    console.log(`Body:\n${body}`);
    console.log("==============================================\n");
    return { success: true, id: `mock-wa-${Date.now()}` };
  }

  try {
    const options: Record<string, unknown> = {
      body,
      from: whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : `whatsapp:${whatsappFrom}`,
      to: formattedTo,
    };

    if (mediaUrl) {
      options.mediaUrl = [mediaUrl];
    }

    // @ts-expect-error - Twilio types mismatch for options with mediaUrl
    const res = await client.messages.create(options);
    return { success: true, id: res.sid };
  } catch (error: unknown) {
    console.error("Twilio WhatsApp send error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
