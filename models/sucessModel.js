class HttpMessage {
  constructor(message, statusCode, data) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
  }
}

export default HttpMessage;