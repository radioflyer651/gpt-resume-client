
export interface JwtPayload {
    sub: string;
    name: string;
    iat: number;
    exp: number;
    // Add other properties as needed
  }