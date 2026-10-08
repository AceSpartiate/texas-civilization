// Read Aloud's grid: what a teacher says most in a day, then jokes and short stories. A plain string is both the
// button and what is read; a pair is [button, what is read]. Edit freely; the grid
// shows them in this order, and the program speaks each one ahead of time in the chosen voice.
export const PRESETS = Object.freeze([
  // Greetings and courtesy
  'Good morning, class.', 'Good afternoon.', 'Welcome back!', 'Please.', 'Thank you.',
  'You\'re welcome.', 'Excuse me.', 'Goodbye, see you tomorrow!', 'Yes.', 'No.',
  // Attention and behaviour
  'Eyes on me, please.', 'Listen carefully.', 'Please be quiet.', 'Please sit down.', 'Raise your hand, please.',
  'Wait your turn.', 'Line up, please.', 'Walk, please.', 'Hands to yourself.', 'Voices off, please.',
  // Directions
  'Take out your notebook.', 'Open your book.', 'Turn to the next page.', 'Write your name on your paper.', 'Read the directions.',
  'Work with a partner.', 'Work in your group.', 'Work on your own.', 'Turn in your work.', 'Clean up your area.',
  // Encouragement
  'Good job!', 'Great work!', 'Well done!', 'Nice try!', 'Keep going!',
  'You can do it!', 'I\'m proud of you.', 'Excellent thinking!', 'Try again.', 'Check your work.',
  // Questions and checks
  'Do you have any questions?', 'Do you understand?', 'Show me a thumbs up if you are ready.', 'What do you think?', 'Can you explain why?',
  'Who can help?', 'Let\'s read together.', 'Time is almost up.', 'Five more minutes.', 'Time to stop.',
  // Corrections
  'That is not okay.', 'Stop that, please.', 'That was not kind.', 'That is not your best work.', 'You are not listening.',
  'That is not the right answer.', 'Please do not interrupt.', 'That behavior is not acceptable.', 'I am disappointed.',
  'You need to do it again.',
  // Knock-knock jokes: [what the button says, what is read]
  ['Knock knock: Lettuce', 'Knock, knock. Who\'s there? Lettuce. Lettuce who? Lettuce in, it\'s cold out here!'],
  ['Knock knock: Boo', 'Knock, knock. Who\'s there? Boo. Boo who? Don\'t cry, it\'s only a joke!'],
  ['Knock knock: Cow says', 'Knock, knock. Who\'s there? Cow says. Cow says who? No, silly. A cow says moo!'],
  ['Knock knock: Orange', 'Knock, knock. Who\'s there? Banana. Banana who? Knock, knock. Who\'s there? Banana. Banana who? Knock, knock. Who\'s there? Orange. Orange who? Orange you glad I didn\'t say banana?'],
  ['Knock knock: Atch', 'Knock, knock. Who\'s there? Atch. Atch who? Bless you!'],
  ['Knock knock: Tank', 'Knock, knock. Who\'s there? Tank. Tank who? You\'re welcome!'],
  ['Knock knock: Olive', 'Knock, knock. Who\'s there? Olive. Olive who? Olive you, and I miss you!'],
  ['Knock knock: Howdy', 'Knock, knock. Who\'s there? Howdy. Howdy who? Howdy you like my joke, partner?'],
  ['Knock knock: Broken pencil', 'Knock, knock. Who\'s there? Broken pencil. Broken pencil who? Never mind. It\'s pointless.'],
  ['Knock knock: Interrupting cow', 'Knock, knock. Who\'s there? Interrupting cow. Interrupting cow wh... Moooo!'],
  // Silly stories: [title, story]
  ['Story: The Polite Dragon', 'Once there was a dragon who was very, very polite. Before he breathed fire, he always said, excuse me. When he toasted marshmallows for the village, he said, you\'re welcome. The villagers liked him so much that they made him class president. He said thank you, and only burned one tiny hole in the flag.'],
  ['Story: The Sock Monster', 'Every night, a small monster crept out of the laundry basket. He did not want to scare anybody. He only wanted one sock, never two. That is why your socks never match. If you find a sock that is all alone, leave it out for him. He is building a sock fort, and it is almost finished.'],
  ['Story: The Armadillo\'s Hat', 'An armadillo in Texas found a cowboy hat by the side of the road. He put it on, and it covered his whole body. Now he looked like a hat that walked. The cows were very confused. The horses laughed so hard they fell over. The armadillo did not mind. It was the shadiest summer he ever had.'],
  ['Story: The Cow on the Moon', 'A cow decided she wanted to jump over the moon. She practiced every morning. On Tuesday, she jumped a little too high and landed right on top of it. The moon said, excuse me, you are standing on my nose. The cow said sorry, and stayed for lunch. The moon cheese was delicious.'],
  ['Story: The Homework Goat', 'A goat lived next door to a school. Every afternoon, he waited by the fence. When students walked by with their homework, he said, may I see that? Then he ate it. The teacher did not believe a word of it, until the goat came to class and turned in a very nice essay.'],
  ['Story: The Pencil Who Lost Its Point', 'A pencil woke up one morning and could not find its point. It looked under the desk. It looked in the backpack. It asked the eraser, who did not remember anything. At last, the sharpener said, I think I can help. The pencil came out sharp, a little shorter, and very proud.'],
  ['Story: The Chicken Who Swam', 'Everybody knows chickens cannot swim. Nobody told Henrietta. She jumped into the pond, kicked her little legs, and floated like a fluffy boat. The ducks were shocked. The frogs gave her a medal. Now she teaches swimming lessons on Saturdays, but only to very brave chickens.'],
  ['Story: The Talking Coffee Mug', 'Our teacher has a coffee mug that talks. When she picks it up, it says, good morning. When she puts it down, it says, not yet, I\'m still warm. On Mondays, it says, please, please, please, more coffee. Nobody else can hear it. But the teacher always smiles, so we think it is true.'],
  ['Story: The Lazy Tornado', 'There once was a tornado who did not like to spin. He liked to sit still and watch clouds. The other storms said, you are supposed to whirl! The tornado said, maybe tomorrow. So instead of blowing roofs away, he gently fanned the farmers on hot days. They named him Breezy, and he was very happy.'],
  ['Story: The Shy Volcano', 'A little volcano was too shy to erupt. Whenever anyone looked at her, she blushed bright red and hid behind a cloud. The other volcanoes rumbled and boomed. One day, a bird landed on her and said, I think you are wonderful. The volcano was so happy that she let out one tiny puff of smoke, shaped like a heart.'],
]);
