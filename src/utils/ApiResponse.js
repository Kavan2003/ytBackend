class ApiResponse {

    constructor(status, message="Success", data) {
        this.status = status;
        this.success = status < 400;
        this.message = message;
        this.data = data;
    }
}
export { ApiResponse}