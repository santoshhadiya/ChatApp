import React, { useCallback } from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useRef } from 'react';

const BACKEND_URL = "https://chatapp-backend-0qe8.onrender.com"
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
  const [typingUser, setTypingUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const inputRef = useRef(null);

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

    socket.on("displayTyping", (data) => {
      if (data.isTyping) {
        setTypingUser(data.user);

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      } else {
        setTypingUser(null);
      }
    });



    return () => {

      socket.off("addRoomList");
      socket.off("roomList");
      socket.off("roomUsers");
      socket.off("displayTyping");

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

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

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

     if (inputRef.current && room) {
      inputRef.current.focus();
    }
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
    if (room) {
      socket.emit("leaveRoom", { room });
    }

    setUserName("");
    setIsLogin(false);
    setIsJoined(false);
    setLoginForm({ username: '', password: '' });
    setRoom("");
    SetChats([]);
    setRoomUsers([]);
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
            <div className="flex items-center">
              {/* Hamburger menu for mobile */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden mr-4 text-indigo-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-3xl font-extrabold text-indigo-700">ChatApp</h1>
              <p className="text-sm text-gray-500 mt-1 ml-2">
                Connected as: <span className="font-medium text-indigo-600">{userName}</span>
              </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-6 bg-gray-100 px-4 py-2 rounded-xl shadow-inner">
              <div className="text-right leading-tight transition-transform hover:scale-105 duration-300 ease-in-out">
                <p className="text-xs text-gray-500 tracking-wide">Welcome back,</p>
                <h2 className="text-xl font-bold text-indigo-700">{userName}</h2>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2 rounded-full shadow-lg transform transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h3a2 2 0 002-2v-1m0-8v-1a2 2 0 00-2-2h-3a2 2 0 00-2 2v1"
                  />
                </svg>
                <span className="font-semibold tracking-wide">Logout</span>
              </button>
            </div>

          </header>

          <div className="flex flex-col lg:flex-row gap-6">

         


            {/* Sidebar */}
            <div className={`${showSidebar ? 'block' : 'hidden'} lg:block w-full lg:w-1/4 space-y-6 transition-all duration-300 ease-in-out`}>
              {/* Room Join Section */}
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-lg text-gray-800">Join a Room</h2>
                  <button
                    onClick={toggleSidebar}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
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
             <div className={`w-full ${showSidebar ? 'lg:w-3/4' : 'lg:w-full'}`}>
              <div className="bg-white rounded-xl shadow overflow-hidden">
                {/* Chat Header */}
                <div className="bg-indigo-600 p-4 text-white flex">
                  <h2 className="text-xl font-semibold">
                    {room ? `Room: ${room}` : 'Select a room to start chatting'}
                  </h2>

                  {typingUser && typingUser !== userName && (
                    <div className="text-sm text-white italic mb-2 ml-2">
                      {typingUser} is typing...
                    </div>
                  )}

                </div>

                {/* Messages */}
                <div className="chat-messages h-96 p-4 overflow-y-auto bg-gray-100 bg-[url('https://camo.githubusercontent.com/ebf18cd85f7aa9dc79fb74c58dc94febf3a6441d8d689cd5a400b2707e19ec0e/68747470733a2f2f7765622e77686174736170702e636f6d2f696d672f62672d636861742d74696c652d6461726b5f61346265353132653731393562366237333364393131306234303866303735642e706e67')]  bg-center w-full bg-opacity-[0.5]">
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
                      ref={inputRef}
                      className="flex-1 border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="Type your message..."
                      value={msg}
                      onChange={(e) => {
                        setMsg(e.target.value);
                        socket.emit("typing", {
                          isTyping: true,
                        });
                      }}

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