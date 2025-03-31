import { HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";



export function dateConverterInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    // If any string matches time/date format on the body object, or a nested object, then
    //  we convert it to a Date object, and set it on the request body.
    if (req.body) {
        // const body = convertDateStrings(req.body);
        // req = req.clone({ body });
    }

    return next(req);
}

/**
 * Recursively converts all valid date-time string properties on the target object into Date objects.
 * @param target The object to transform in-place.
 */
export function convertDateStrings(target: any): any {
    if (target && typeof target === 'object') {
        if (Array.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                convertDateStrings(target[i]);
            }
        } else {
            for (const key of Object.keys(target)) {
                const value = target[key];
                if (typeof value === 'string' && isValidDate(value)) {
                    target[key] = new Date(value);
                } else {
                    convertDateStrings(value);
                }
            }
        }
    } else if (typeof target === 'string' && isValidDate(target)) {
        target = new Date(target);
    }

    return target;
}

function isValidDate(dateValue: string): boolean {
    const timestamp = Date.parse(dateValue);
    return !isNaN(timestamp);
}