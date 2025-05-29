import React from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

let socket;
const App = () => {
  const [tmp, setTmp] = useState("");
  const [msg, setMsg] = useState("");
  const [userName, setUserName] = useState("");
  const [chats, SetChats] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [room, setRoom] = useState("");
  const [allRooms, setAllRooms] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);

  useEffect(() => {
    socket = io('http://localhost:3000');
    socket.on("connect", () => {
      setTmp("Connected with Socket id: " + socket.id)
    });

    socket.on("sendMsg", (data) => {
      SetChats((prev) => [...prev, { message: data.message, user: data.user, auth: data.auth == socket.id }]);
    })

    socket.on("addRoomList", (data) => {
      setAllRooms((prev) => {
        const exists = prev.some((r) => r.roomName === data.room);
        return exists ? prev : [...prev, { roomName: data.room }];
      });
    });

    socket.on("roomList", (data) => {
      setAllRooms(data.map((val) => ({ roomName: val })))
    })

    socket.on("roomUsers", (users) => {
      setRoomUsers(users);
    });
  }, []);

  useEffect(() => {
    console.log(chats);
  }, [chats])

  const sendMsg = () => {
    socket.emit("sendMsg", { msg, userName });
    setMsg("")
  }

  const join = () => {
    if (userName == "") return;
    socket.emit("join", { userName })
    setIsJoined(true)
  }

  const joinRoom = () => {
    socket.emit("joinRoom", { room });
    SetChats([]);
    socket.emit("addRoomList", { room });
  }

  useEffect(() => {
    const box = document.querySelector(".chat-messages");
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [chats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Join Section */}
      {!isJoined ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">Welcome to ChatApp</h1>
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Your Name
                </label>
                <input
                  type="text"
                  id="username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && join()}
                />
              </div>
              <button
                onClick={join}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md"
              >
                Join Chat
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4 max-w-7xl">
          <header className="bg-white rounded-xl shadow p-4 mb-6">
            <h1 className="text-2xl font-bold text-indigo-700">ChatApp</h1>
            <p className="text-sm text-gray-500">Connected as: <span className="font-medium">{userName}</span></p>
          </header>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full lg:w-1/4 space-y-6">
              {/* Room Join Section */}
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-lg mb-3 text-gray-800">Join a Room</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="Room name"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  />
                  <button
                    onClick={joinRoom}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    Join
                  </button>
                </div>
              </div>

              {/* Room List */}
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-lg mb-3 text-gray-800">Available Rooms</h2>
                <ul className="space-y-1">
                  {allRooms.map((val, index) => (
                    <li 
                      key={index} 
                      onClick={() => setRoom(val.roomName)} 
                      className={`p-2 rounded-lg cursor-pointer transition ${room === val.roomName ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center">
                        <span className="material-icons-outlined mr-2">#</span>
                        <span>{val.roomName}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Users in Room */}
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-lg mb-3 text-gray-800">Users in Room</h2>
                {roomUsers.length > 0 ? (
                  <ul className="space-y-2">
                    {roomUsers.map((user) => (
                      <li 
                        key={user.id} 
                        className="flex items-center p-2 rounded-lg bg-gray-50"
                      >
                        <div className={`w-3 h-3 rounded-full mr-2 ${user.name === userName ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
                        <span className={user.name === userName ? 'font-medium text-green-700' : 'text-gray-700'}>
                          {user.name === userName ? 'You' : user.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No users in this room yet</p>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="w-full lg:w-3/4">
              <div className="bg-white rounded-xl shadow overflow-hidden">
                {/* Chat Header */}
                <div className="bg-indigo-600 p-4 text-white">
                  <h2 className="text-xl font-semibold">
                    {room ? `Room: ${room}` : 'Select a room to start chatting'}
                  </h2>
                </div>

                {/* Messages */}
                <div className="chat-messages h-96 p-4 overflow-y-auto bg-gray-50">
                  {chats.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    chats.map((val, i) => (
                      <div
                        key={i}
                        className={`mb-4 flex ${val.auth ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${val.auth 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'}`}
                        >
                          {!val.auth && (
                            <p className="text-xs font-semibold text-indigo-600 mb-1">{val.user}</p>
                          )}
                          <p className={val.auth ? 'text-white' : 'text-gray-800'}>{val.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="Type your message..."
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMsg()}
                      disabled={!room}
                    />
                    <button
                      onClick={sendMsg}
                      disabled={!room}
                      className={`px-6 py-3 rounded-lg shadow transition ${room 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App