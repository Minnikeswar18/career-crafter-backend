const setupSocket = async(io) => {
    io.on("connection", socket => {
        socket.on("joinRoom", (data) => {
            const {roomId , username} = data;
             socket.join(roomId);
             socket.to(roomId).emit("joined", username);
        });

        socket.on("sendMessage" , (messageContent) =>{
             socket.to(messageContent.roomId).emit("receiveMessage", messageContent);
        })

        socket.on("leftRoom" , (data) => {
            const {roomId , username} = data;
            socket.to(roomId).emit("left" , username);
        });

        socket.on("disconnect", () => {
            console.log("User Disconnected");
        });
    });
};

module.exports = setupSocket;
