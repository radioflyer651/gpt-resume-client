import { environment } from "../environments/environment";

export function getApiBaseUrl(): string {
    // Get the base URL from the environment variables.
    return environment.apiBaseUrl;
}

/** Returns an absolute URL to the server api, given a specified path. */
export function constructApiUrl(path: string): string {
    let result = getApiBaseUrl();

    // Add a leading slash, if needed.
    if (!result.endsWith('/')) {
        result += '/';
    }

    // Remove the slash from the path, if there is one.
    if (path.startsWith('/')) {
        path = path.substring(1);
    }

    // Return the construction.
    return result + path;
}