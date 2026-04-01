
const validation = {
  minLength: (length:number) => ({
    minLength: [length, `Must be at least ${length} characters long`],
  }),
  maxLength: (length:number) => ({
    maxlength: [length, `Cannot exceed ${length} characters`],
  }),
  required: (field:string) => ([true, `${field} is required`]),

  email: {
    match: [/.+@.+\..+/, 'Please enter a valid email address'],
    lowercase: true,
    trim: true,
  },
  password: {
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
  },
};

module.exports = { validation };
