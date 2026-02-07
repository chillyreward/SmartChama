import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Read the form data sent by Twilio
    const formData = await req.formData();
    const text = formData.get("Body")?.toString().trim() || ""; // What the user typed

    // 2. The Logic (Simple Menu Tree)
    let response = "";

    if (text.toLowerCase() === "hi" || text.toLowerCase() === "start") {
      response = `Welcome to SmartChama
1. Check Balance
2. Deposit Money
3. Request Loan
4. My Group Status
(Reply with a number)`;
    } else if (text === "1") {
      response = `Your Personal Savings: KES 45,000
Group Total: KES 1,250,000
Reply 0 to go back.`;
    } else if (text === "2") {
      response = `Enter amount to deposit via M-Pesa (e.g. 500):`;
    } else if (text === "3") {
      response = `Loan Limit: KES 15,000
Enter amount to borrow:`;
    } else if (text === "4") {
      response = `Group: Family Savings
Role: Admin
Next Meeting: Friday 2PM`;
    } else if (text === "0") {
      // Go back to main menu
      response = `Welcome to SmartChama
1. Check Balance
2. Deposit Money
3. Request Loan
4. My Group Status`;
    } else {
      // Fallback
      response = `Invalid option.
Reply START to see the menu.`;
    }

    // 3. Return Plain Text (XML is standard for Twilio, but Text works for simple SMS)
    return new NextResponse(response, {
      headers: { "Content-Type": "text/plain" },
    });

  } catch (error) {
    console.error("USSD Error:", error);
    return new NextResponse("System Error", { status: 500 });
  }
}