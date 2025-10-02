using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;

namespace HireThemNoW.Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IAmazonSimpleEmailService _sesClient;
        private readonly ILogger<EmailService> _logger;
        private const string FROM_EMAIL = "support@hirethemnow.xyz";

        public EmailService(IAmazonSimpleEmailService sesClient, ILogger<EmailService> logger)
        {
            _sesClient = sesClient;
            _logger = logger;
        }

        public async Task SendResumeAnalysisCompleteEmailAsync(string toEmail, string userName, int atsScore)
        {
            var subject = "Your Resume Analysis is Ready! 🎉";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; }}
        .score-box {{ background: white; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .score {{ font-size: 48px; font-weight: bold; color: {(atsScore >= 80 ? "#10b981" : atsScore >= 60 ? "#f59e0b" : "#ef4444")}; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎉 Your Resume Analysis is Complete!</h1>
        </div>
        <div class=""content"">
            <p>Hi {userName},</p>
            <p>Great news! We've finished analyzing your resume with our AI-powered ATS system.</p>

            <div class=""score-box"">
                <div class=""score"">{atsScore}/100</div>
                <p style=""margin: 10px 0 0 0; color: #6b7280;"">Overall ATS Score</p>
            </div>

            <p><strong>Your analysis includes:</strong></p>
            <ul>
                <li>✅ 6-dimensional score breakdown</li>
                <li>💪 Identified strengths</li>
                <li>🎯 Priority improvement suggestions</li>
                <li>🔑 Keyword analysis (found & missing)</li>
                <li>📊 Readability assessment</li>
            </ul>

            <div style=""text-align: center;"">
                <a href=""https://hirethemnow.xyz/dashboard/resume-analysis"" class=""button"">
                    View Full Analysis →
                </a>
            </div>

            <p style=""margin-top: 30px; color: #6b7280; font-size: 14px;"">
                💡 Tip: Higher ATS scores increase your chances of getting past automated screening systems and landing interviews!
            </p>
        </div>
        <div class=""footer"">
            <p>© 2025 HireThemNow. All rights reserved.</p>
            <p>Need help? Reply to this email or visit our <a href=""https://hirethemnow.xyz"">support center</a>.</p>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, htmlBody);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var sendRequest = new SendEmailRequest
                {
                    Source = FROM_EMAIL,
                    Destination = new Destination
                    {
                        ToAddresses = new List<string> { toEmail }
                    },
                    Message = new Message
                    {
                        Subject = new Content(subject),
                        Body = new Body
                        {
                            Html = new Content
                            {
                                Charset = "UTF-8",
                                Data = htmlBody
                            }
                        }
                    }
                };

                var response = await _sesClient.SendEmailAsync(sendRequest);
                _logger.LogInformation("Email sent successfully to {Email}. MessageId: {MessageId}", toEmail, response.MessageId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                throw;
            }
        }
    }
}
