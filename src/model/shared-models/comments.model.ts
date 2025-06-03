
/** Detailed comments have a subject and the value, so they can be identified easier. */
export interface Comment {
    /** The title or subject of the comment. */
    title: string;

    /** Details about this comment. */
    detail: string;

    /** When set, this comment should be removed from AI contexts that might go to outside users. */
    isPrivateComment?: boolean;
}
