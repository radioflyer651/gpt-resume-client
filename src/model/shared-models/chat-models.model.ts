import { ObjectId } from 'mongodb';
import { ResponseInputItem } from '../../forwarded-types.model';
import { ChatTypes } from './chat-types.model';

/** A shortened data set for a Chat so it can be returned for lists.*/
export interface ChatInfo {
    /** Gets or sets the database ID for this chat. */
    _id: ObjectId;

    /** Allows soft delete of chats. */
    isDeleted?: boolean;

    /** Gets or sets the ID of the user who owns this chat. */
    userId: ObjectId;

    /** The LLM model to use for this chat interaction. */
    model: string;

    /** Gets or sets the type of chat this is.  Different types of chats
     *   have different types of interactions on the site. */
    chatType: ChatTypes;

    /** Gets or sets the date this chat was last updated. */
    lastAccessDate: Date;

    /** The date/time this chat was created. */
    creationDate: Date;
}

export interface Chat extends ChatInfo {
    /** Gets or sets a set of system messages to be fed to the chat
     *   at the beginning of the dialog.  This sets up the chat assistant to
     *   fulfill its purpose. */
    systemMessages: string[];

    /** Gets or sets the chat messages that were sent in this interaction. */
    chatMessages: ResponseInputItem[];
}

/** The representation of a Chat on the client side. */
export type ClientChat = Omit<Chat, 'chatMessages' | 'systemMessages' | 'isDeleted'> & { chatMessages: ChatMessage[]; };

/** The possible values for roles in a ChatMessage. */
export type ChatMessageRoleTypes = 'system' | 'user' | 'assistant';

/** Simplified ResponseInputItem object, where only a role and content is emitted. */
export interface ChatMessage {
    /** Gets or sets the message that was sent. */
    content: string;

    /** Gets or sets the role that sent the message. */
    role: ChatMessageRoleTypes;
}