export interface GmailComposeParams {
  to: string;
  subject: string;
  body: string;
}

export class GmailService {
  /**
   * Generates a Gmail compose URL with pre-filled data
   */
  static generateComposeUrl(params: GmailComposeParams): string {
    const baseUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
    
    // URL encode the parameters to handle special characters
    const urlParams = new URLSearchParams({
      to: params.to,
      su: params.subject,
      body: params.body
    });
    
    return `${baseUrl}&${urlParams.toString()}`;
  }

  /**
   * Opens Gmail compose in a new tab with pre-filled data
   */
  static openCompose(params: GmailComposeParams): void {
    const url = this.generateComposeUrl(params);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Formats email body with resume URL
   */
  static formatEmailBody(body: string, resumeUrl?: string): string {
    let formattedBody = body;
    
    if (resumeUrl) {
      formattedBody += `\n\nResume: ${resumeUrl}`;
    }
    
    return formattedBody;
  }
}