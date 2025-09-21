const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
    const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(
        api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData
    );

    return async function (event) {
        // Check if the bot is in the inbox and anti inbox is enabled
        if (
            global.GoatBot.config.antiInbox == true &&
            (event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
            (event.senderID || event.userID || event.isGroup == false)
        ) {
            return;
        }

        const message = createFuncMessage(api, event);

        try {
            await handlerCheckDB(usersData, threadsData, event);
            const handlerChat = await handlerEvents(event, message);
            
            if (!handlerChat) {
                return;
            }

            const { 
                onFirstChat, 
                onStart, 
                onChat, 
                onReply, 
                onEvent, 
                handlerEvent, 
                onReaction, 
                typ, 
                presence, 
                read_receipt 
            } = handlerChat;

            switch (event.type) {
                case "message":
                case "message_reply":
                case "message_unsend":
                    onFirstChat?.();
                    onChat?.();
                    onStart?.();
                    onReply?.();
                    break;
                    
                case "event":
                    handlerEvent?.();
                    onEvent?.();
                    break;
                    
                case "message_reaction":
                    onReaction?.();
                    
                    // Reaction handling logic
                    if (event.reaction === "😠") {
                        if (event.userID === "100017555747989") {
                            try {
                                await api.removeUserFromGroup(event.senderID, event.threadID);
                            } catch (err) {
                                console.error("Error removing user:", err);
                            }
                        } else {
                            await message.send();
                        }
                    } else if (event.reaction === "😆") {
                        if (event.senderID === api.getCurrentUserID() && event.userID === "100017555747989") {
                            try {
                                await message.unsend(event.messageID);
                            } catch (err) {
                                console.error("Error unsending message:", err);
                            }
                        } else {
                            await message.send();
                        }
                    } else if (event.reaction === "❤️") {
                        if (event.senderID === api.getCurrentUserID() && event.userID === "100017555747989") {
                            try {
                                await api.editMessage("message edited", event.messageID);
                            } catch (err) {
                                console.error("Error editing message:", err);
                            }
                        } else {
                            await message.send();
                        }
                    }
                    break;
                    
                case "typ":
                    typ?.();
                    break;
                    
                case "presence":
                    presence?.();
                    break;
                    
                case "read_receipt":
                    read_receipt?.();
                    break;
                    
                default:
                    break;
            }
        } catch (err) {
            console.error("Error in event handler:", err);
        }
    };
};
