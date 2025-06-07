import React, { useCallback } from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = "https://chatapp-backend-0qe8.onrender.com";
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
  const [isChangingRoom, setIsChangingRoom] = useState(false);

  // Login state
  const [isLogin, setIsLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '' // In a real app, never handle passwords like this without proper security
  });

  useEffect(() => {
    if (userName) {
      join();
    }
  }, [userName])

  useEffect(() => {
    socket = io(`${BACKEND_URL}`);
    socket.on("connect", () => {
      setTmp("Connected with Socket id: " + socket.id)
    });

    socket.on("addRoomList", (data) => {
      /* Keep this if needed for other purposes */
    });

    socket.on("roomList", (data) => {
      setAllRooms(data.map((val) => ({ roomName: val })))
    });

    socket.on("roomUsers", (users) => {
      setRoomUsers(users);
    });

    return () => {
      // Clean up all listeners on unmount
      socket.off("addRoomList");
      socket.off("roomList");
      socket.off("roomUsers");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = (data) => {
      if (data.room === room) {
        SetChats((prev) => [...prev, {
          room: data.room,
          message: data.message,
          user: data.user,
          auth: data.auth === socket.id
        }]);
      }
    };

    socket.on("sendMsg", handleNewMessage);

    return () => {
      socket.off("sendMsg", handleNewMessage);
    };
  }, [room]);

  {
    isChangingRoom && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          Changing rooms...
        </div>
      </div>
    )
  }

  useEffect(() => {
    console.log(chats);
  }, [chats])



  const sendMsg = useCallback(() => {
    if (!room || !msg.trim()) return;
    socket.emit("sendMsg", { msg, userName, room });
    setMsg("");
  }, [room, msg, userName]);

  const join = () => {
    if (userName) {
      socket.emit("join", { userName });
      setIsJoined(true);
      getChats();
    };
  }

  const joinRoom = () => {
    socket.emit("joinRoom", { room });
    SetChats([]);
    setAllRooms((prev) => {
      const exists = prev.some((r) => r.roomName === room);
      return exists ? prev : [...prev, { roomName: room }];
    });
    socket.emit("addRoomList", { room });
  }

  useEffect(() => {
    const box = document.querySelector(".chat-messages");
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [chats]);

  const getChats = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/chats/userChats`, { fullName: userName });
      const result = res.data;

      const uniqueRooms = [...new Set(result.map(val => val.room))];
      const roomObjects = uniqueRooms.map(room => ({ roomName: room }));
      setAllRooms(roomObjects);

    } catch (err) {
      console.error("Error:", err);
    }
  };


  const getRoomData = async (roomName) => {
    if (isChangingRoom) return;

    setIsChangingRoom(true);
    SetChats([]);

    if (room) {
      socket.emit("leaveRoom", { room });
    }

    setRoom(roomName);

    try {
      const res = await axios.post(`${BACKEND_URL}/chats/roomChats`, { roomName });
      console.log("missing chats: " + res.data);
      SetChats(res.data);
      socket.emit("joinRoom", { room: roomName });
    } catch (err) {
      console.error("Error changing rooms:", err);
    } finally {
      setIsChangingRoom(false);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle login submission
  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, you would verify credentials properly
    setUserName(loginForm.username);
    setIsLogin(true);
    setIsJoined(true);
  };

  // Handle logout
  const handleLogout = () => {
    setUserName("");
    setIsLogin(false);
    setIsJoined(false);
    setLoginForm({ username: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Login Section */}
      {!isLogin ? (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">Login to ChatApp</h1>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={loginForm.username}
                  onChange={handleLoginChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow transition"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4 max-w-7xl">
          <header className="bg-white rounded-xl shadow px-6 py-4 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            {/* Left Section */}
            <div>
              <h1 className="text-3xl font-extrabold text-indigo-700">ChatApp</h1>
              <p className="text-sm text-gray-500 mt-1">
                Connected as: <span className="font-medium text-indigo-600">{userName}</span>
              </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome,</p>
                <h2 className="text-lg font-semibold text-indigo-700">{userName}</h2>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition"
              >
                Logout
              </button>
            </div>
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
                {isChangingRoom && (
                  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg">Changing rooms...</div>
                  </div>
                )}
                <ul className="space-y-1">
                  {allRooms.map((val, index) => (
                    <li
                      key={index}
                      onClick={() => getRoomData(val.roomName)}
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
                        className={`mb-4 flex ${val.user == userName ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${val.user == userName
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'}`}
                        >
                          {val.user != userName && (
                            <p className="text-xs font-semibold text-indigo-600 mb-1">{val.user}</p>
                          )}
                          <p className={val.user == userName ? 'text-white' : 'text-gray-800'}>{val.message}</p>
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

export default App;