const setupSocket = (io) => {
    io.on("connection", socket => {
        socket.on("joinRoom", data => {
            const {roomId , username} = data;
            socket.join(roomId);
            console.log(username ,"joined room", roomId);
        });

        socket.on("sendMessage" , messageContent =>{
            socket.to(messageContent.roomId).emit("receiveMessage", messageContent);
        })

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
};

module.exports = setupSocket;
