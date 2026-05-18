
interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    // In a real application, you would use nodemailer or a transactional email service (SendGrid, SES, etc.)
    console.log("---------------------------------------------------");
    console.log("📧 MOCK EMAIL SENT");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log("---------------------------------------------------");

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return true;
};

export const sendRecruiterReportEmail = async (recruiterEmail: string, candidateName: string, role: string, reportHtml: string) => {
    return sendEmail({
        to: recruiterEmail,
        subject: `Assessment Report: ${candidateName} - ${role}`,
        html: reportHtml
    });
};
