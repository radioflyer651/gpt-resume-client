import { ObjectId } from "mongodb";
import { TokenPayload } from "./shared-models/token-payload.model";

/** The info on a user that's currently logged in. */
export type SiteUser = Omit<TokenPayload, 'userId'> & { userId: ObjectId; };