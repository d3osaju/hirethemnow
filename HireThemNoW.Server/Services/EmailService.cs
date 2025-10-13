using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;

namespace HireThemNoW.Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IAmazonSimpleEmailService _sesClient;
        private readonly IDataService _dataService;
        private readonly ILogger<EmailService> _logger;
        private const string FROM_EMAIL = "support@hirethemnow.xyz";

        public EmailService(IAmazonSimpleEmailService sesClient, IDataService dataService, ILogger<EmailService> logger)
        {
            _sesClient = sesClient;
            _dataService = dataService;
            _logger = logger;
        }

        public async Task SendAnalysisCompleteEmailAsync(string userId, string toEmail, string userName, int atsScore, List<string> topRecommendations)
        {
            // Check email preferences first
            var emailPrefs = await _dataService.GetEmailPreferencesAsync(userId);
            if (emailPrefs != null && !emailPrefs.WeeklyPerformanceReport)
            {
                _logger.LogInformation("Skipping analysis complete email for user {UserId} - opted out of performance reports", userId);
                return;
            }

            var subject = "Your Resume Analysis is Ready! 🎉";

            // Get top 3 recommendations for preview
            var previewRecommendations = topRecommendations.Take(3).ToList();
            var recommendationsHtml = string.Join("", previewRecommendations.Select(r => $"<li style=\"margin: 8px 0; color: #374151;\">{r}</li>"));

            var scoreColor = atsScore >= 80 ? "#10b981" : atsScore >= 60 ? "#f59e0b" : "#ef4444";
            var scoreLabel = atsScore >= 80 ? "Excellent" : atsScore >= 60 ? "Good" : "Needs Improvement";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
        .content {{ padding: 30px; background: #f9fafb; }}
        .score-section {{ background: white; border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .score {{ font-size: 56px; font-weight: bold; color: {scoreColor}; margin: 0; }}
        .score-label {{ font-size: 18px; color: #6b7280; margin: 10px 0 0 0; }}
        .recommendations {{ background: white; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .recommendations h3 {{ color: #1f2937; margin: 0 0 15px 0; font-size: 18px; }}
        .recommendations ul {{ margin: 0; padding-left: 20px; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .features {{ background: white; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .features ul {{ margin: 0; padding-left: 0; list-style: none; }}
        .features li {{ margin: 12px 0; padding-left: 30px; position: relative; color: #374151; }}
        .features li:before {{ content: '✅'; position: absolute; left: 0; }}
        .footer {{ text-align: center; padding: 30px; color: #6b7280; font-size: 14px; background: #f3f4f6; }}
        .tip {{ background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1 style=""margin: 0; font-size: 28px;"">🎉 Your Resume Analysis is Complete!</h1>
            <p style=""margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;"">AI-powered ATS compatibility analysis</p>
        </div>
        <div class=""content"">
            <p style=""font-size: 16px; margin: 0 0 20px 0;"">Hi {userName},</p>
            <p style=""font-size: 16px; color: #374151;"">Great news! We've finished analyzing your resume with our advanced AI system. Here's your comprehensive ATS compatibility report:</p>

            <div class=""score-section"">
                <div class=""score"">{atsScore}/100</div>
                <p class=""score-label"">Overall ATS Score - {scoreLabel}</p>
            </div>

            {(previewRecommendations.Any() ? $@"
            <div class=""recommendations"">
                <h3>🎯 Top Priority Improvements</h3>
                <ul>
                    {recommendationsHtml}
                </ul>
                {(topRecommendations.Count > 3 ? $"<p style=\"margin: 15px 0 0 0; color: #6b7280; font-size: 14px;\">+ {topRecommendations.Count - 3} more recommendations in your full report</p>" : "")}
            </div>" : "")}

            <div class=""features"">
                <h3 style=""color: #1f2937; margin: 0 0 15px 0; font-size: 18px;"">📊 Your Complete Analysis Includes:</h3>
                <ul>
                    <li>6-dimensional score breakdown (formatting, keywords, experience, education, skills, achievements)</li>
                    <li>Identified strengths and areas for improvement</li>
                    <li>Keyword analysis with found and missing terms</li>
                    <li>Readability assessment and suggestions</li>
                    <li>Section-by-section detailed feedback</li>
                    <li>Actionable recommendations for improvement</li>
                </ul>
            </div>

            <div style=""text-align: center;"">
                <a href=""https://hirethemnow.xyz/resume-analysis"" class=""button"">
                    View Full Analysis Report →
                </a>
            </div>

            <div class=""tip"">
                <p style=""margin: 0; color: #1e40af; font-size: 14px;"">
                    💡 <strong>Pro Tip:</strong> Higher ATS scores significantly increase your chances of getting past automated screening systems and landing interviews. Aim for 80+ for optimal results!
                </p>
            </div>
        </div>
        <div class=""footer"">
            <p style=""margin: 0 0 10px 0;"">© 2025 HireThemNow. All rights reserved.</p>
            <p style=""margin: 0;"">Need help? Reply to this email or visit our <a href=""https://hirethemnow.xyz"" style=""color: #667eea;"">support center</a>.</p>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, htmlBody);
            _logger.LogInformation("Analysis complete email sent to user {UserId} with ATS score {Score}", userId, atsScore);
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

        public async Task SendParsingCompleteEmailAsync(string userId, string toEmail, string userName)
        {
            // Check email preferences first
            var emailPrefs = await _dataService.GetEmailPreferencesAsync(userId);
            if (emailPrefs != null && !emailPrefs.WeeklyPerformanceReport)
            {
                _logger.LogInformation("Skipping parsing complete email for user {UserId} - opted out of performance reports", userId);
                return;
            }

            var subject = "Your Resume Has Been Parsed Successfully! 📄";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }}
        .content {{ padding: 30px; background: #f9fafb; }}
        .status-box {{ background: white; border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .status-icon {{ font-size: 48px; margin-bottom: 15px; }}
        .next-steps {{ background: white; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .next-steps h3 {{ color: #1f2937; margin: 0 0 15px 0; font-size: 18px; }}
        .next-steps ul {{ margin: 0; padding-left: 0; list-style: none; }}
        .next-steps li {{ margin: 12px 0; padding-left: 30px; position: relative; color: #374151; }}
        .next-steps li:before {{ content: '⚡'; position: absolute; left: 0; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .footer {{ text-align: center; padding: 30px; color: #6b7280; font-size: 14px; background: #f3f4f6; }}
        .info-box {{ background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1 style=""margin: 0; font-size: 28px;"">✅ Resume Parsing Complete!</h1>
            <p style=""margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;"">Your resume has been successfully processed</p>
        </div>
        <div class=""content"">
            <p style=""font-size: 16px; margin: 0 0 20px 0;"">Hi {userName},</p>
            <p style=""font-size: 16px; color: #374151;"">Great news! We've successfully parsed your resume and extracted all the important information.</p>

            <div class=""status-box"">
                <div class=""status-icon"">📄 ✅</div>
                <h2 style=""color: #10b981; margin: 0 0 10px 0;"">Parsing Complete</h2>
                <p style=""color: #6b7280; margin: 0;"">Your resume content has been structured and is ready for analysis</p>
            </div>

            <div class=""next-steps"">
                <h3>🚀 What's Happening Next:</h3>
                <ul>
                    <li>Our AI is now analyzing your resume for ATS compatibility</li>
                    <li>We're calculating scores across 6 key dimensions</li>
                    <li>Identifying strengths and improvement opportunities</li>
                    <li>Generating personalized recommendations</li>
                </ul>
            </div>

            <div class=""info-box"">
                <p style=""margin: 0; color: #0369a1; font-size: 14px;"">
                    ⏱️ <strong>Analysis in Progress:</strong> Your comprehensive ATS analysis typically takes 1-2 minutes to complete. You'll receive another email with your detailed results shortly!
                </p>
            </div>

            <div style=""text-align: center;"">
                <a href=""https://hirethemnow.xyz/resume-analysis"" class=""button"">
                    Check Analysis Status →
                </a>
            </div>
        </div>
        <div class=""footer"">
            <p style=""margin: 0 0 10px 0;"">© 2025 HireThemNow. All rights reserved.</p>
            <p style=""margin: 0;"">Need help? Reply to this email or visit our <a href=""https://hirethemnow.xyz"" style=""color: #10b981;"">support center</a>.</p>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, htmlBody);
            _logger.LogInformation("Parsing complete email sent to user {UserId}", userId);
        }

        public async Task SendAnalysisFailedEmailAsync(string userId, string toEmail, string userName, string errorMessage)
        {
            // Check email preferences first
            var emailPrefs = await _dataService.GetEmailPreferencesAsync(userId);
            if (emailPrefs != null && !emailPrefs.WeeklyPerformanceReport)
            {
                _logger.LogInformation("Skipping analysis failed email for user {UserId} - opted out of performance reports", userId);
                return;
            }

            var subject = "Resume Analysis Issue - Let's Get This Fixed! 🔧";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }}
        .content {{ padding: 30px; background: #f9fafb; }}
        .error-box {{ background: white; border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b; }}
        .error-icon {{ font-size: 48px; margin-bottom: 15px; }}
        .solutions {{ background: white; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .solutions h3 {{ color: #1f2937; margin: 0 0 15px 0; font-size: 18px; }}
        .solutions ul {{ margin: 0; padding-left: 0; list-style: none; }}
        .solutions li {{ margin: 12px 0; padding-left: 30px; position: relative; color: #374151; }}
        .solutions li:before {{ content: '💡'; position: absolute; left: 0; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .support-button {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
        .footer {{ text-align: center; padding: 30px; color: #6b7280; font-size: 14px; background: #f3f4f6; }}
        .error-details {{ background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1 style=""margin: 0; font-size: 28px;"">🔧 Analysis Issue Detected</h1>
            <p style=""margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;"">Don't worry - we can fix this together!</p>
        </div>
        <div class=""content"">
            <p style=""font-size: 16px; margin: 0 0 20px 0;"">Hi {userName},</p>
            <p style=""font-size: 16px; color: #374151;"">We encountered an issue while analyzing your resume, but don't worry - this is usually an easy fix!</p>

            <div class=""error-box"">
                <div class=""error-icon"">⚠️</div>
                <h2 style=""color: #d97706; margin: 0 0 15px 0;"">Analysis Temporarily Unavailable</h2>
                <div class=""error-details"">
                    <p style=""margin: 0; color: #92400e; font-size: 14px;""><strong>Issue:</strong> {errorMessage}</p>
                </div>
            </div>

            <div class=""solutions"">
                <h3>🛠️ Quick Solutions to Try:</h3>
                <ul>
                    <li>Wait a few minutes and try again (temporary service issues usually resolve quickly)</li>
                    <li>Check that your PDF isn't password-protected or corrupted</li>
                    <li>Ensure your resume is under 5MB in size</li>
                    <li>Try uploading a different version of your resume</li>
                    <li>Make sure your resume contains readable text (not just images)</li>
                </ul>
            </div>

            <div style=""text-align: center;"">
                <a href=""https://hirethemnow.xyz/resume-analysis"" class=""button"">
                    Try Analysis Again →
                </a>
                <br>
                <a href=""https://hirethemnow.xyz/contact"" class=""button support-button"" style=""margin-left: 10px;"">
                    Contact Support →
                </a>
            </div>

            <div style=""background: #e0f2fe; border-left: 4px solid #0288d1; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;"">
                <p style=""margin: 0; color: #01579b; font-size: 14px;"">
                    💬 <strong>Need Help?</strong> Our support team is here to help! Reply to this email or use the contact form, and we'll get your analysis working perfectly.
                </p>
            </div>
        </div>
        <div class=""footer"">
            <p style=""margin: 0 0 10px 0;"">© 2025 HireThemNow. All rights reserved.</p>
            <p style=""margin: 0;"">Need immediate help? Reply to this email or visit our <a href=""https://hirethemnow.xyz"" style=""color: #667eea;"">support center</a>.</p>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, htmlBody);
            _logger.LogInformation("Analysis failed email sent to user {UserId} with error: {Error}", userId, errorMessage);
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
