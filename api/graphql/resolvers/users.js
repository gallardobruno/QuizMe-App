const { Schema } = require('mongoose');
const User = require('./../../models/User.js');
const { Expo } = require('expo-server-sdk');
module.exports = {
	Query: {
		getUsers: async (_, __, { user }) => {
			if (user.role !== 'ADMIN') throw new Error('Not authorized');
			const users = await User.find();
			return users;
		},
		getCompletedQuizzes: async (__, _, { user }) => {
			const userfind = await User.findById(user._id);
			return userfind.completedQuiz;
		},
	},

	Mutation: {
		completeQuiz: async (_, { quizId }, { user }) => {
			const userfind = await User.findOneAndUpdate(
				{ _id: user._id },
				{ $push: { completedQuiz: quizId } },
				{ new: true }
			);
			return userfind;
		},

		updateUser: async (_, { userBody }, { user }) => {
			const userfind = await User.findOneAndUpdate(
				{ _id: user._id },
				userBody,
				{ new: true }
			);
			return userfind;
		},
		changePassword: async (_, { currPass, newPass }, { user }) => {
			const userFind = await User.findById(user._id);
			if (userFind.compare(currPass)) {
				userFind.password = newPass;
				await userFind.save();
				return 'Updated Succesfully';
			}
			throw new Error('Auth Failed');
		},
		changeEmail: async (_, { newMail, currPass }, { user }) => {
			const userFind = await User.findById(user._id);
			if (userFind.compare(currPass)) {
				// Si lo mandaba desde la instancia
				// me queria volver a guardar el password
				// y como no pasa el validate por el hash
				//  me lo rechazaba
				await User.updateOne({ _id: user._id }, { email: newMail });
				return newMail;
			}
			throw new Error('Auth Failed');
		},
		setNotificationToken: async (_, { token }, { user }) => {
			await User.updateOne(
				{ _id: user._id },
				{ notificationToken: token }
			);
			return 'Token Added Succesfully';
		},

		activateUser: async (_, { userId, isActive }, { user }) => {
			if (user.role !== 'ADMIN') throw new Error('Not authorized');
			await User.updateOne({ _id: userId }, { isActive });
			return 'Updated Succesfully';
		},

		validateUser: async (_, { userID }) => {
			await User.updateOne({ _id: userID }, { validated: true });
			return 'Validated succesfully';
		},
		premiumUser: async (_, __, { user }) => {
			await User.updateOne({ _id: user._id }, { premium: true });
			return 'User premiumnificated (? succesfully';
		},
		sendNotification: async (_, { message, title, data }, { user }) => {
			let expo = new Expo();
			let messages = [];
			const newUser = await User.findById(user._id);
			let pushToken = newUser.notificationToken;

			if (!Expo.isExpoPushToken(pushToken)) {
				throw new Error(
					`Push token ${pushToken} is not a valid Expo push token`
				);
			}

			messages.push({
				to: pushToken,
				sound: 'default',
				title: title,
				body: message,
				data: data || {},
			});

			let chunks = expo.chunkPushNotifications(messages);
			for (let chunk of chunks) {
				await expo.sendPushNotificationsAsync(chunk);
			}
			return 'Notification send succesfully';
		},
	},
};
